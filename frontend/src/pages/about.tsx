import type { NextPage } from "next";
import Head from "next/head";

const About: NextPage = () => {
    return (
        <>
            <Head>
                <title>About</title>
            </Head>
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-4xl font-bold mb-4">About</h1>
                <p className="text-center">
                    Creator centered audio streaming platform
                </p>
            </div>
        </>
    );
};

export default About;
