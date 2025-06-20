import { NextPage } from "next";
import Head from "next/head";
import BackendState from "../components/BackendState";
import Navbar from "../components/Navbar";
import AnimatedLogo from "../components/AnimatedLogo";
import Logo from "../components/Logo";
import AudioCard from "../components/AudioCard";

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar />
        <BackendState />
        <h1 className="text-center">Welcome</h1>
      </div>
    </>
  );
};

export default Home;