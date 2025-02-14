import { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import Player from "../components/Player";
import AudioList from "../components/List";
import { AudioType } from "../components/Audio";
import LoginButton from "../components/LoginButton";
import LogoutButton from "../components/LogoutButton";
import { fetchFromAPI } from "../utils/communication";
import BackendState from "../components/BackendState";
import Navbar from "../components/Navbar";


const Home: NextPage = () => {
  const [data, setData] = useState<AudioType[]>([]);
  const [currentAudio, setCurrentAudio] = useState<{ src?: string; title?: string }>({
    src: undefined,
    title: undefined,
  });

  // Fetching data when the button is clicked
  const HandleClick = async (endpoint: string) => {
    try {
      let data = await fetchFromAPI(endpoint, {}, "application/json");
      setData(await data.json());
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlay = (audio: AudioType) => {
    console.log("Playing audio:", audio.title);
    console.log("Source:", audio.source);
    setCurrentAudio({ src: audio.source, title: audio.title });
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Home</h1>
        <BackendState />
        <button
          onClick={() => HandleClick("/sound/tracks")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition duration-300"
        >
          Fetch Data
        </button>

        <AudioList audios={data} onPlay={handlePlay} />
        <Player src={currentAudio.src} title={currentAudio.title} />

        <LoginButton />
        <LogoutButton />
      </div>
    </>
  );
};

export default Home;
