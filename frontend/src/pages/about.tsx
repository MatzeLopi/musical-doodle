import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";
import BackendState from "../components/BackendState";

const About: NextPage = () => {
    return (
        <>
            <Head>
                <title>About</title>
            </Head>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <h1 className="text-4xl font-bold mb-4">About</h1>
                    <p className="text-center">
                        Creator centered audio streaming platform
                    </p>
                </div>
                <BackendState />
            </div>
        </>
    );
};

export default About;
