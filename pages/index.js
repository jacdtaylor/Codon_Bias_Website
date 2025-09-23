import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import SectionTitle from "../components/sectionTitle";

import { benefitOne, benefitTwo } from "../components/data";
import Video from "../components/video";
import Benefits from "../components/benefits";
import Footer from "../components/footer";
import Testimonials from "../components/testimonials";
import Cta from "../components/cta";
import Faq from "../components/faq";
import PopupWidget from "../components/popupWidget";

const Home = () => {
  return (
    <>
      <Head>
        <title>CUBhub</title>
        <meta
          name="description"
          content="This is our website now!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <link rel="stylesheet" href="filter.css" />
      <Navbar />
      <Hero />
    </>
  );
}

export default Home;