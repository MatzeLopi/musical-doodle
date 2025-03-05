import { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import { AudioType } from "../components/Audio";
import { fetchFromAPI } from "../utils/communication";
import BackendState from "../components/BackendState";
import Navbar from "../components/Navbar";
import TagSelector from "../components/TagSelector";
import { Tag } from "../components/TagSelector";
import CategorySelector, { Category } from "../components/CategoriesSelector";
import Info from "../components/Info";

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

  const handleTagChange = (tags: Tag[]) => {
    console.log("Selected tags:", tags);
  };

  const handleCategoryChange = (category: Category | null) => {
    console.log("Selected category:", category);
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar />
        <BackendState />

      </div>
    </>
  );
};

export default Home;