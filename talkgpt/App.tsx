import React, { useEffect, useState } from "react";
import { Button, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { playFromPath } from "./utils/playFromPath";

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
})

export default function App() {
  const [borderColor, setBorderColor] = useState <"lightgray" | "lightgreen">
  ("lightgray")

  const [urlPath, setUrlPath] = useState("");

  const { state, startRecognizing, stopRecognizing, destroyRecognizer} =
    useVoiceRecognition()

    useEffect(() => {
      listFiles();
    }, []);

    const listFiles = async () => {
      try {
        const result = await FileSystem.readDirectoryAsync(
          FileSystem.documentDirectory!
        );
        if (result.length > 0) {
          const filename = result[0];
          const path = FileSystem.documentDirectory + filename;
          console.log("Full path to the file:", path);
          setUrlPath(path);
        }
      } catch (error) {
        console.error("An error occurred while listing the files:", error);
      }
    };
  

  const handleSubmit = async () => {
    if(!state.results[0]) return
    try {
      const audioBlob = await fetchAudio(state.results[0])

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {

          const audioData = e.target.result.split(",")[1];

          const path = await writeAudioToFile(audioData);

          await playFromPath(path);
          destroyRecognizer();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.error("An error occurred:", e);
    }
  };

  const fetchAudio = async (text: string) => {
    const response = await fetch(
      "http://localhost:3000/text-to-speech/synthesize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
    return await response.blob();
  };

  const writeAudioToFile = async (audioData: string) => {
    const path = FileSystem.documentDirectory + "temp.mp3";
    await FileSystem.writeAsStringAsync(path, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  };

  async function playFromPath(path: string) {
    try {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: path });
      await soundObject.playAsync();
    } catch (error) {
      console.log("An error occurred while playing the audio:", error);
    }
  }

  return (
    <View style={styles.container}>

      <Text 
        style={{ 
          fontSize: 38, 
          fontWeight: "bold",
          marginBottom: 25
          }}>
          🤖Talk GPT Abi👩‍🔧
      </Text>

      <Text 
        style={{
          fontSize: 20, 
          fontStyle: "italic",
          fontWeight: "bold",
          marginBottom: 5
          }}>
          📢presiona el boton para poder hablar conmigo y
          resolvere tus dudas🙌🏼
      </Text>

      <Text
        style={{
          fontSize: 15, 
          fontWeight: "bold",
          fontStyle: "italic"
          }}>
            Dime tu mensaje📥:
      </Text>

      <Pressable
        onPressIn={() => {
          setBorderColor("lightgreen")
          startRecognizing()
        }}
        onPressOut={() => {
          setBorderColor("lightgray")
          stopRecognizing()
          handleSubmit()
        }}
        style={{
          width: "90%",
          padding: 30,
          gap: 10,
          borderWidth: 3,
          alignItems: "center",
          borderRadius: 10,
          borderColor: borderColor
        }}>
        <Text
          style={{
            marginVertical: 10, 
            fontSize: 15,
            borderRadius: 30,
            fontStyle: "italic"
          }}>
            🛑Espera para hablar🛑
        </Text>
      </Pressable>

      <Text
        style={{
          fontSize: 15, 
          fontWeight: "bold",
          fontStyle: "italic"
          }}>
          {JSON.stringify(state, null, 2)}
      </Text>

      <Button 
        title="Reproduce el ultimo mensaje ▶️"
        onPress={async () => await playFromPath(urlPath)}/>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  action: {
    textAlign: "center",
    color: "#0000FF",
    marginVertical: 5,
    fontWeight: "bold",
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
    fontSize: 12,
  },
  stat: {
    textAlign: "center",
    color: "#B0171F",
    marginBottom: 1,
  },
});



