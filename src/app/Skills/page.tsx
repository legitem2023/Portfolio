import About from "@/components/About";
import Information from "@/components/Information";
import Head from "@/components/Partial/Head";
import Main from "@/components/Partial/Main";
import Menu from "@/components/Partial/Menu";
import Skills from "@/components/Skills";
import Image from "next/image";

export default function Home() {
  return (
      <div className="Main">
        <Menu/>
        <Skills/>
      </div>
  );
}
