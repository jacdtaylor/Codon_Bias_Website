import Link from "next/link";
import { Disclosure } from "@headlessui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import heroImg from "../public/favicon.ico";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const [clickedIndex, setClickedIndex] = useState(null);

  const pageNames = [
    "Compare Genes",
    "Compare Genomes",
  
    "Compare Ontology"
  ];
  const links = [
    "/compareOrtho",
    "/genomewide",
   
    "/ontology"
  ];

  return (
    <div className="sticky top-0 z-50">
      <nav className="drop-shadow-sm flex items-center justify-right lg:flex-wrap bg-slate-100 p-0 border-b border-gray-200">
        <div className="flex items-center flex-shrink-0 text-black mr-6 px-2 py-1 w-5/6 lg:w-auto">
          <Link href="/">
            <Image
              src={heroImg}
              width="40"
              height="40"
              alt="NEAR Logo"
              loading="eager"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight no-underline rounded-md hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none"
          >
            &nbsp;&nbsp;CUBhub
          </Link>
        </div>
        <Disclosure>
          {({ open }) => (
            <>
              <div className="items-center justify-between w-full lg:w-auto">
                <Disclosure.Button
                  aria-label="Toggle Menu"
                  className="px-2 py-1 ml-auto text-gray-500 rounded-md lg:hidden hover:text-blue-500 focus:text-blue-500 focus:bg-blue-100 focus:outline-none"
                >
                  <svg
                    className="w-6 h-6 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    {open ? (
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2z"
                      />
                    )}
                  </svg>
                </Disclosure.Button>

                {/* Mobile Menu */}
                <Disclosure.Panel className="flex flex-wrap items-center justify-center w-full my-5 lg:hidden">
                  <ul className="flex flex-col items-center space-y-2">
                    {pageNames.map((name, index) => {
                      const isActive = router.pathname === links[index];
                      const isClicked = clickedIndex === index;

                      return (
                        <li key={index}>
                          <Link
                            href={links[index]}
                            className={`px-4 py-2 rounded-md transition-colors ${
                              isClicked
                                ? "text-red-500"
                                : isActive
                                ? "text-indigo-700 font-bold"
                                : "text-gray-800"
                            } hover:text-indigo-500 focus:outline-none`}
                            onClick={() => setClickedIndex(index)}
                          >
                            {name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Disclosure.Panel>
              </div>
            </>
          )}
        </Disclosure>

        {/* Desktop Menu */}
        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
            {pageNames.map((name, index) => {
              const isActive = router.pathname === links[index];
              const isClicked = clickedIndex === index;

              return (
                <li className="mr-3 nav__item" key={index}>
                  <Link
                    href={links[index]}
                    className={`inline-block px-4 py-2 text-md font-normal no-underline rounded-md transition-colors ${
                      isClicked
                        ? "text-red-500"
                        : isActive
                        ? "text-gray-800 font-semibold"
                        : "text-gray-800"
                    } hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none`}
                    onClick={() => setClickedIndex(index)}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden text-center lg:flex lg:items-center w-full flex-grow lg:w-auto">
          <div className="text-xl lg:flex-grow"></div>
        </div>
      </nav>
    </div>
  );
}

