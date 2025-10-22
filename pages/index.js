import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";

const Home = () => {
  return (
    <>
      <Head>
        <title>CUBhub</title>
        <meta
          name="description"
          content="Codon Usage Bias Hub: for all your CUB analyses!"
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