import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Player from "../components/Player";
import AudioList from "../components/List";
import { AudioType } from "../components/Audio";


const Home: NextPage = () => {
  const [data, setData] = useState<AudioType[]>([]);

  const fetchData = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const result = await response.json();
      setData(result);

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Home</h1>
        <button onClick={() => fetchData("http://localhost:8000/sound/tracks")}>Fetch Data</button>

        <AudioList audios={data} />
        <Player src="http://localhost:8000/sound/stream?file_name=Some Long Audio Name" />
      </div>
    </>
  );
};

export default Home;