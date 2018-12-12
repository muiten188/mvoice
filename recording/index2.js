import React, { Component } from 'react'
import { WebView, TouchableOpacity, View, Text } from 'react-native'
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
const options = {
  sampleRate: 16000,  // default 44100
  channels: 1,        // 1 or 2, default 1
  bitsPerSample: 16,  // 8 or 16, default 16
  wavFile: 'test.wav' // default 'audio.wav'
};
const audioRecorderPlayer = new AudioRecorderPlayer();
export default class Main extends Component {
  componentDidMount() {

  }


  

  onStartRecord = async () => {
    const result = await this.audioRecorderPlayer.startRecorder();
    this.audioRecorderPlayer.addRecordBackListener((e) => {
      this.setState({
        recordSecs: e.current_position,
        recordTime: this.audioRecorderPlayer.mmssss(Math.floor(e.current_position)),
      });
      return;
    });
    console.log(result);
  }

  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recordSecs: 0,
    });
    console.log(result);
  }

  onStartPlay = async () => {
    console.log('onStartPlay');
    const msg = await this.audioRecorderPlayer.startPlayer();
    console.log(msg);
    this.audioRecorderPlayer.addPlayBackListener((e) => {
      if (e.current_position === e.duration) {
        console.log('finished');
        this.audioRecorderPlayer.stopPlayer();
      }
      this.setState({
        currentPositionSec: e.current_position,
        currentDurationSec: e.duration,
        playTime: this.audioRecorderPlayer.mmssss(Math.floor(e.current_position)),
        duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      });
      return;
    });
  }

  onPausePlay = async () => {
    await this.audioRecorderPlayer.pausePlayer();
  }

  onStopPlay = async () => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  }




  startRecording() {
    // arrData=[]
    // Recording.init({
    //   bufferSize: 4096,
    //   sampleRate: 44100,
    //   bitsPerChannel: 16,
    //   channelsPerFrame: 1,
    // })

    // const listener = Recording.addRecordingEventListener(data => {
    //   if (this.webView) {
    //     this.webView.postMessage(data)
    //   }
    //   this.arrData.push(data)
    //   console.log(data)
    // })

    // Recording.start()
    AudioRecord.init(options);
    AudioRecord.start();
  }


  async endRecording() {
    // Recording.stop()
    // debugger;
    // try {
    //   RNSaveAudio.saveWav('/filename.wav',this.arrData);
    // } catch (error) {
    //   debugger
    // }
    AudioRecord.stop();
    audioFile = await AudioRecord.stop();

  }

  componentWillUnmount() {

  }

  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'column', width: '100%' }}>

        <View style={{ flex: 1 }}>
          <WebView
            ref={ref => this.webView = ref}
            style={{ flex: 1 }}
            source={require('./webview.html')} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', width: '100%', height: 100 }}>
          <View style={{ width: '50%', height: 50, backgroundColor: 'powderblue' }}>
            <TouchableOpacity onPress={this.onStartRecord.bind(this)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text>start</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: '50%', height: 50, backgroundColor: 'skyblue' }} >
            <TouchableOpacity onPress={this.onStopPlay.bind(this)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text>stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )

  }
}
