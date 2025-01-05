import type { NextPage } from "next";
import Head from "next/head";

const About: NextPage = () => {
    return (
        <>
            <Head>
                <title>About</title>
            </Head>
            <div>
                <h1 className="text-4xl font-bold mb-4">About</h1>
                <p>
                    Createor centered autio streaming platform
                </p>
            </div>
        </>
    );

};

export default About;