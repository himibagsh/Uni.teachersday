import AVFoundation
import Foundation

// transcode <in> <out> <longSide> <videoKbps> <audioKbps>
let a = CommandLine.arguments
guard a.count == 6 else { FileHandle.standardError.write("usage: transcode in out longSide vKbps aKbps\n".data(using:.utf8)!); exit(2) }
let inURL = URL(fileURLWithPath: a[1]), outURL = URL(fileURLWithPath: a[2])
let longSide = Double(a[3])!, vKbps = Int(a[4])!, aKbps = Int(a[5])!

let asset = AVURLAsset(url: inURL)
let sem = DispatchSemaphore(value: 0)
var fail: String? = nil

Task {
  do {
    guard let vTrack = try await asset.loadTracks(withMediaType: .video).first else { throw NSError(domain:"x",code:1,userInfo:[NSLocalizedDescriptionKey:"no video track"]) }
    let aTrack = try await asset.loadTracks(withMediaType: .audio).first
    let natural = try await vTrack.load(.naturalSize)
    let xform   = try await vTrack.load(.preferredTransform)
    let nomFps  = try await vTrack.load(.nominalFrameRate)
    let dur     = try await asset.load(.duration)

    // display size after rotation
    let disp = natural.applying(xform)
    let dW = abs(disp.width), dH = abs(disp.height)
    let scale = min(1.0, longSide / max(dW, dH))
    func even(_ v: Double) -> Int { max(2, Int((v * 0.5).rounded()) * 2) }
    // encode in NATURAL orientation; the transform tells players how to rotate
    let encW = even(natural.width  * scale)
    let encH = even(natural.height * scale)

    if FileManager.default.fileExists(atPath: outURL.path) { try FileManager.default.removeItem(at: outURL) }
    let reader = try AVAssetReader(asset: asset)
    let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true   // faststart: plays while downloading

    let vOut = AVAssetReaderTrackOutput(track: vTrack, outputSettings: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
      kCVPixelBufferWidthKey  as String: encW,
      kCVPixelBufferHeightKey as String: encH,
    ])
    vOut.alwaysCopiesSampleData = false
    reader.add(vOut)

    var aOut: AVAssetReaderTrackOutput? = nil
    if let aTrack {
      let o = AVAssetReaderTrackOutput(track: aTrack, outputSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false,
      ])
      o.alwaysCopiesSampleData = false
      reader.add(o); aOut = o
    }

    let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: encW, AVVideoHeightKey: encH,
      AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: vKbps * 1000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoAllowFrameReorderingKey: true,            // B-frames
        AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
        AVVideoExpectedSourceFrameRateKey: Int(nomFps.rounded()),
        AVVideoMaxKeyFrameIntervalDurationKey: 2.0,      // seekable
      ] as [String: Any],
    ])
    vIn.expectsMediaDataInRealTime = false
    vIn.transform = xform
    writer.add(vIn)

    var aIn: AVAssetWriterInput? = nil
    if aOut != nil {
      let i = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVNumberOfChannelsKey: 2, AVSampleRateKey: 44100,
        AVEncoderBitRateKey: aKbps * 1000,
      ])
      i.expectsMediaDataInRealTime = false
      writer.add(i); aIn = i
    }

    guard reader.startReading() else { throw reader.error ?? NSError(domain:"x",code:2) }
    guard writer.startWriting() else { throw writer.error ?? NSError(domain:"x",code:3) }
    writer.startSession(atSourceTime: .zero)

    let total = dur.seconds
    let group = DispatchGroup()
    func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderTrackOutput, _ label: String, progress: Bool) {
      group.enter()
      let q = DispatchQueue(label: label)
      input.requestMediaDataWhenReady(on: q) {
        while input.isReadyForMoreMediaData {
          guard let sb = output.copyNextSampleBuffer() else { input.markAsFinished(); group.leave(); return }
          if progress {
            let t = CMSampleBufferGetPresentationTimeStamp(sb).seconds
            if Int(t) % 15 == 0 { FileHandle.standardError.write("  \(Int(t))/\(Int(total))s\n".data(using:.utf8)!) }
          }
          if !input.append(sb) { input.markAsFinished(); group.leave(); return }
        }
      }
    }
    pump(vIn, vOut, "v", progress: true)
    if let aIn, let aOut { pump(aIn, aOut, "a", progress: false) }
    group.wait()

    await writer.finishWriting()
    if writer.status != .completed { throw writer.error ?? NSError(domain:"x",code:4) }
    let sz = (try FileManager.default.attributesOfItem(atPath: outURL.path)[.size] as? Int) ?? 0
    print("OK \(encW)x\(encH) rot=\(xform.a == 0 && xform.b != 0 ? "yes" : "no") \(String(format:"%.1f",Double(sz)/1e6))MB dur=\(String(format:"%.1f",total))s")
  } catch { fail = "\(error)" }
  sem.signal()
}
sem.wait()
if let fail { FileHandle.standardError.write("FAILED: \(fail)\n".data(using:.utf8)!); exit(1) }
