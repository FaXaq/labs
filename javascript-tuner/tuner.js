const GUITAR_STRING_FREQUENCIES = [
  { name: 'E2', frequency: 82.4068892282175 },
  { name: 'A2', frequency: 110 },
  { name: 'D3', frequency: 146.8323839587038 },
  { name: 'G3', frequency: 195.99771799087463 },
  { name: 'B3', frequency: 246.94165062806206 },
  { name: 'E4', frequency: 329.6275569128699 }
]

// requesting mic input
const audioStreamRequest = navigator.mediaDevices.getUserMedia({ audio: true })

/**
 * @param {number} frequency - Custom frequency to get magnitude from the FFTValues
 * @param {number} frequencyBinRange
 * @param {number[]} FFTValues
 */

function getFrequencyMagnitudeFromFFT(frequency, frequencyBinRange, FFTValues) {
  const frequencyBinIndex = Math.floor(frequency / frequencyBinRange)
  return FFTValues[frequencyBinIndex]
}

/**
 * @param {{name: string, frequency: number, magnitude: number}} guitarString
 * @param {number} frequencyBinRange
 * @param {number[]} FFTValues
 */

function isStringInTune(guitarString, frequencyBinRange, FFTValues) {
  const prevMagnitude = getFrequencyMagnitudeFromFFT(guitarString.frequency - frequencyBinRange, frequencyBinRange, FFTValues)
  const nextMagnitude = getFrequencyMagnitudeFromFFT(guitarString.frequency + frequencyBinRange, frequencyBinRange, FFTValues)

  return prevMagnitude - guitarString.magnitude < 0 && nextMagnitude - guitarString.magnitude < 0
}

/**
 * @param {AnalyserNode} analyser - AnalayserNode to collect data from
 */

function collectAnalyserData(analyser) {
  // Uint8Array should be the same length as the frequencyBinCount
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)
  console.log("Working with a frequency bin range of ", dataArray)

  const frequencyBinRange = analyser.context.sampleRate / analyser.fftSize

  const guitarStringWithMagnitudes = GUITAR_STRING_FREQUENCIES.map(gsf => {
    return {
      ...gsf,
      magnitude: getFrequencyMagnitudeFromFFT(gsf.frequency, frequencyBinRange, dataArray)
    }
  })

  const guessedString = guitarStringWithMagnitudes.reduce((p, c) => p.magnitude < c.magnitude ? c : p)
  console.log(guessedString)
  console.log(isStringInTune(guessedString, frequencyBinRange, dataArray))

  setTimeout(() => collectAnalyserData(analyser), 300)
}

audioStreamRequest
  .then((audioStream) => {
    const ctx = new AudioContext()
    // creating a source node from the mic input
    const sourceNode = ctx.createMediaStreamSource(audioStream)

    const analyserNode = ctx.createAnalyser()
    sourceNode.connect(analyserNode)
    analyserNode.fftSize = 32768

    collectAnalyserData(analyserNode)
  })
  .catch(err => {
    console.error(err)
  })