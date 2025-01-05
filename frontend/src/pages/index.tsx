import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Player from "../components/Player";

const Home: NextPage = () => {
  const [data, setData] = useState<string[] | null>(null);

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
        <button
          onClick={() => fetchData("http://localhost:8000/sound/tracks")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
        >
          Get Tracks
        </button>
        {data && (
          <div className="mt-4 w-1/2 max-h-96 overflow-y-auto bg-white shadow-md rounded p-4">
            <ul className="list-disc list-inside">
              {data.map((item, index) => (
                <li key={index} className="py-1">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Player src="http://localhost:8000/sound/stream?file_name=test" />
      </div>
    </>
  );
};

export default Home;