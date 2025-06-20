import { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";
import BackendState from "../components/BackendState";
import HorizontalCarousel from "../components/HorizontalCarousel";
import { Audio } from "../components/types";
import { useEffect, useState } from "react";
import { fetchFromAPI } from "../utils/communication";

// Mock data - replace with your actual API calls
const mockMostListened: Audio[] = [{
  id: "1",
  title: "Sunset Boulevard",
  creator: "user123",
  description: "A chill lofi beat to relax to.",
  audio_url: "/mock-audio/sunset.mp3",
  private: false,
  category: { id: "cat-1", name: "Lofi" },
  tags: [{ id: "tag-1", name: "Chill" }, { id: "tag-2", name: "Instrumental" }]
},
{
  id: "2",
  title: "Ocean Waves",
  creator: "asmr_artist",
  description: "The calming sound of ocean waves.",
  audio_url: "/mock-audio/ocean.mp3",
  private: false,
  category: { id: "cat-2", name: "Nature Sounds" },
  tags: [{ id: "tag-3", name: "ASMR" }, { id: "tag-4", name: "Relaxing" }]
},
{
  id: "3",
  title: "Cyberpunk City",
  creator: "synthwave_god",
  description: "An energetic synthwave track for late-night coding.",
  audio_url: "/mock-audio/cyberpunk.mp3",
  private: false,
  category: { id: "cat-3", name: "Synthwave" },
  tags: [{ id: "tag-5", name: "Energetic" }, { id: "tag-6", name: "80s" }]
},
{
  id: "4",
  title: "Forest Ambience",
  creator: "nature_lover",
  description: "The gentle sounds of a forest.",
  audio_url: "/mock-audio/forest.mp3",
  private: false,
  category: { id: "cat-2", name: "Nature Sounds" },
  tags: [{ id: "tag-4", name: "Relaxing" }, { id: "tag-7", name: "Peaceful" }]
},
{
  id: "5",
  title: "Midnight Drive",
  creator: "user123",
  description: "A synthwave track for a midnight drive.",
  audio_url: "/mock-audio/drive.mp3",
  private: false,
  category: { id: "cat-3", name: "Synthwave" },
  tags: [{ id: "tag-5", name: "Energetic" }, { id: "tag-8", name: "Driving" }]
}
];

const mockRecentlyAdded: Audio[] = [
  {
    id: "6",
    title: "Rainy Day",
    creator: "chilled_cow",
    description: "A relaxing lofi track for a rainy day.",
    audio_url: "/mock-audio/rain.mp3",
    private: false,
    category: { id: "cat-1", name: "Lofi" },
    tags: [{ id: "tag-1", name: "Chill" }, { id: "tag-4", name: "Relaxing" }]
  },
  {
    id: "7",
    title: "Cosmic Journey",
    creator: "space_explorer",
    description: "An ambient track for a journey through the cosmos.",
    audio_url: "/mock-audio/cosmos.mp3",
    private: false,
    category: { id: "cat-4", name: "Ambient" },
    tags: [{ id: "tag-7", name: "Peaceful" }, { id: "tag-9", name: "Space" }]
  },
  {
    id: "8",
    title: "Summer Vibes",
    creator: "beach_dude",
    description: "A happy and upbeat track for a summer day.",
    audio_url: "/mock-audio/summer.mp3",
    private: false,
    category: { id: "cat-5", name: "Pop" },
    tags: [{ id: "tag-10", name: "Happy" }, { id: "tag-11", name: "Upbeat" }]
  },
  {
    id: "9",
    title: "Jungle Expedition",
    creator: "adventure_man",
    description: "An epic orchestral track for an adventure.",
    audio_url: "/mock-audio/jungle.mp3",
    private: false,
    category: { id: "cat-6", name: "Orchestral" },
    tags: [{ id: "tag-12", name: "Epic" }, { id: "tag-13", name: "Adventure" }]
  },
  {
    id: "10",
    title: "City Lights",
    creator: "urban_explorer",
    description: "A modern pop track for a night out in the city.",
    audio_url: "/mock-audio/city.mp3",
    private: false,
    category: { id: "cat-5", name: "Pop" },
    tags: [{ id: "tag-5", name: "Energetic" }, { id: "tag-14", name: "Nightlife" }]
  }
];


const Home: NextPage = () => {
  const [mostListened, setMostListened] = useState<Audio[]>(mockMostListened);
  const [recentlyAdded, setRecentlyAdded] = useState<Audio[]>(mockRecentlyAdded);

  // TODO: Replace this with your actual API fetching logic
  useEffect(() => {
    // Example of how you might fetch the data in the future
    /*
    fetchFromAPI('/sound/most-listened')
        .then(res => res.json())
        .then(data => setMostListened(data.items));

    fetchFromAPI('/sound/recently-added')
        .then(res => res.json())
        .then(data => setRecentlyAdded(data.items));
    */
    setMostListened(mockMostListened);
    setRecentlyAdded(mockRecentlyAdded);
  }, []);

  return (
    <>
      <Head>
        <title>Musical Doodle - Discover and Share Music</title>
        <meta name="description" content="Your new favorite audio streaming platform." />
      </Head>
      <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Navbar />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="text-center py-20 bg-white dark:bg-zinc-800">
            <h1 className="text-5xl font-bold mb-4">Welcome to Musical Doodle</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">The best place to discover and share music.</p>
          </section>

          {/* Most Listened Carousel */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6">Most Listened</h2>
              <HorizontalCarousel audios={mostListened} />
            </div>
          </section>

          {/* Recently Added Carousel */}
          <section className="py-12 bg-white dark:bg-zinc-800">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6">Recently Added</h2>
              <HorizontalCarousel audios={recentlyAdded} />
            </div>
          </section>
        </main>

        <BackendState />

        <footer className="text-center p-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          <p>&copy; 2024 Musical Doodle</p>
        </footer>
      </div>
    </>
  );
};

export default Home;