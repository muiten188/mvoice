
import React, { Component } from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableHighlight,
  Platform,
  PermissionsAndroid,
  Alert
} from 'react-native';

import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
const baseDir = '/storage/emulated/0/';
let _intervalGetText = null;
class AudioExample extends Component {

  state = {
    currentTime: 0.0,
    recording: false,
    paused: false,
    stoppedRecording: false,
    finished: false,
    audioPath: baseDir + "m_voice" + "/test.m4a",
    hasPermission: undefined,
    resultText: '',
    statusText: '',
    arrDataText: []
  };

  prepareRecordingPath(audioPath) {
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 44100,
      Channels: 1,
      AudioQuality: "low",
      AudioEncoding: "aac",
      AudioEncodingBitRate: 32000
    });
  }

  componentDidMount() {
    AudioRecorder.requestAuthorization().then((isAuthorised) => {
      this.setState({ hasPermission: isAuthorised });

      if (!isAuthorised) return;

      this.prepareRecordingPath(this.state.audioPath);

      AudioRecorder.onProgress = (data) => {
        this.setState({ currentTime: Math.floor(data.currentTime) });
      };

      AudioRecorder.onFinished = (data) => {
        // Android callback comes in the form of a promise instead.
        if (Platform.OS === 'ios') {
          this._finishRecording(data.status === "OK", data.audioFileURL, data.audioFileSize);
        }
      };
    });
  }

  _renderButton(title, onPress, active) {
    var style = (active) ? styles.activeButtonText : styles.buttonText;

    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>
          {title}
        </Text>
      </TouchableHighlight>
    );
  }

  _renderPauseButton(onPress, active) {
    var style = (active) ? styles.activeButtonText : styles.buttonText;
    var title = this.state.paused ? "RESUME" : "PAUSE";
    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>
          {title}
        </Text>
      </TouchableHighlight>
    );
  }

  async _pause() {
    if (!this.state.recording) {
      console.warn('Can\'t pause, not recording!');
      return;
    }

    try {
      const filePath = await AudioRecorder.pauseRecording();
      this.setState({ paused: true });
    } catch (error) {
      console.error(error);
    }
  }

  async _resume() {
    if (!this.state.paused) {
      console.warn('Can\'t resume, not paused!');
      return;
    }

    try {
      await AudioRecorder.resumeRecording();
      this.setState({ paused: false });
    } catch (error) {
      console.error(error);
    }
  }

  async _stop() {
    if (!this.state.recording) {
      console.warn('Can\'t stop, not recording!');
      return;
    }

    this.setState({ stoppedRecording: true, recording: false, paused: false, resultText: 'Đang tải file ghi âm lên server...' });

    try {
      const filePath = await AudioRecorder.stopRecording();
      this._upload();
      if (Platform.OS === 'android') {
        this._finishRecording(true, filePath);
      }
      return filePath;
    } catch (error) {
      console.error(error);
    }
  }

  async _play() {
    if (this.state.recording) {
      await this._stop();
    }

    // These timeouts are a hacky workaround for some issues with react-native-sound.
    // See https://github.com/zmxv/react-native-sound/issues/89.
    setTimeout(() => {
      var sound = new Sound(this.state.audioPath, '', (error) => {
        if (error) {
          console.log('failed to load the sound', error);
        }
      });

      setTimeout(() => {
        this.setState({ resultText: 'Đang phát file ghi âm...' });
        sound.play((success) => {
          if (success) {
            this.setState({ resultText: 'Kết thúc phát.' });
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
        });
      }, 100);
    }, 100);
  }

  async _record() {
    this.setState({ recording: true, paused: false, resultText: 'Đang ghi âm...',arrDataText:[] });
    if (_intervalGetText) {
      clearInterval(_intervalGetText);
    }
    if (this.state.recording) {
      console.warn('Already recording!');
      return;
    }

    if (!this.state.hasPermission) {
      console.warn('Can\'t record, no permission granted!');
      return;
    }

    if (this.state.stoppedRecording) {
      this.prepareRecordingPath(this.state.audioPath);
    }

    

    try {
      const filePath = await AudioRecorder.startRecording();
    } catch (error) {
      console.error(error);
    }
  }

  _finishRecording(didSucceed, filePath, fileSize) {
    this.setState({ finished: didSucceed });
    console.log(`Finished recording of duration ${this.state.currentTime} seconds at path: ${filePath} and size of ${fileSize || 0} bytes`);
  }

  _getText = async (apiUrlGetText, response) => {
    console.log(apiUrlGetText + "?meeting_id=" + response.data[0].id)
    fetch(apiUrlGetText + "?meeting_id=" + response.data[0].id, {
      method: 'GET',
      headers: {
        'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJydCI6MTUzMzcxMDUzNCwidWlkIjoiNWI2YTkwYzZjNTFiZDcwMDBhNzU3ZTkxIn0.yvnr5_f0wR8Kjo6e2rDguIPhnwkrWg-khYC0dI5ooxc',
      }
    }).then((res) => res.json())
      .then(response => {
        console.log('Text: ' + response.data)
        this.setState({ resultText: 'Phân tích giọng nói thành văn bản:\n', arrDataText: response.data });
        // Alert.alert(
        //   'Success : ' + response.data,
        //   'Get TExt',
        //   [

        //     { text: 'OK', onPress: () => console.log('OK Pressed') }
        //   ],
        //   { cancelable: false }
        // )
      }).catch(err => {
        console.error(err)
      })
  }

  _upload = async () => {
    let apiUrlUpLoad = 'https://meeting.vais.vn/api/v1/meeting/upload';
    let apiUrlGetText = 'https://meeting.vais.vn/api/v1/transcription'
    if (this.state.recording) {
      Alert.alert('Can\'t upload, now on recording!');
    }
    else {
      const path = 'file://' + this.state.audioPath;
      // const path1 = this.state.audioPath;
      // console.error("Path : "+path1)

      let file = { uri: path, type: 'audio/wav', name: 'test.m4a' };//, type: 'audio/aac', name: 'test.aac'           'content-type': 'multipart/form-data; boundary=----',

      const formData = new FormData();
      formData.append('speech', file);
      fetch(apiUrlUpLoad, {
        method: 'POST',
        headers: {
          'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJydCI6MTUzMzcxMDUzNCwidWlkIjoiNWI2YTkwYzZjNTFiZDcwMDBhNzU3ZTkxIn0.yvnr5_f0wR8Kjo6e2rDguIPhnwkrWg-khYC0dI5ooxc',
          'content-type': 'multipart/form-data;'
        },
        body: formData
      }).then((res) => res.json())
        .then(response => {
          if (response.code == 200) {
            this._getText(apiUrlGetText, response)
            _intervalGetText = setInterval(() => {
              this._getText(apiUrlGetText, response)
            }, 5000);
          }
          else {
            Alert.alert(
              'Success : ' + response.success,
              'Audio Uploaded Successfully',
              [

                { text: 'OK', onPress: () => console.log('OK Pressed') }
              ],
              { cancelable: false }
            )
          }

        }).catch(err => {
          console.error(err)
        })

    }
  }

  render() {

    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          <View style={{ height: 300, paddingTop: 30 }}>
            {this._renderButton("RECORD", () => { this._record() }, this.state.recording)}
            {this._renderButton("PLAY", () => { this._play() })}
            {this._renderButton("STOP", () => { this._stop() })}
            {/* {this._renderButton("PAUSE", () => {this._pause()} )} */}
            {/* {this._renderPauseButton(() => { this.state.paused ? this._resume() : this._pause() })} */}
            <Text style={styles.progressText}>{this.state.currentTime}s</Text>
          </View>
          <Text style={{ color: '#fff' }}>{this.state.resultText}</Text>
          <ScrollView style={{ flex: 1, paddingLeft: 4, paddingRight: 4 }}>
            {this.state.arrDataText.map((text, index) => {
              return (<Text key={index} style={{ fontSize: 22, color: '#fff' }}>{text.text}</Text>)
            })}

          </ScrollView>

        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: "#2b608a",
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    paddingTop: 10,
    fontSize: 50,
    color: "#fff"
  },
  button: {
    padding: 10
  },
  disabledButtonText: {
    color: '#eee'
  },
  buttonText: {
    fontSize: 20,
    color: "#fff"
  },
  activeButtonText: {
    fontSize: 20,
    color: "#B81F00"
  }

});

export default AudioExample;
