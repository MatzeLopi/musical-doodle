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
        <AnimatedLogo size={200} />
        <Logo size={200} />
        <BackendState />
        <AudioCard title="Test" audio_url="https://media.soundgasm.net/sounds/5c6597129913ac5f8957e2db9dd131b8f4475dbf.m4a" category={{id: "Default", name: "Default"}} creator="UUID" description="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet." id="ID" private={true} tags={[{id:"someId", name:"Tag1"}, {id: "SomeId", name:"Name2"}]}/>
      </div>
    </>
  );
};

export default Home;