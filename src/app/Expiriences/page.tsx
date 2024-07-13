import About from "@/components/About";
import Expiriences from "@/components/Expiriences";
import Information from "@/components/Information";
import Head from "@/components/Partial/Head";
import Main from "@/components/Partial/Main";
import Menu from "@/components/Partial/Menu";
import Projects from "@/components/Projects";
import Image from "next/image";

export default function Home() {
  return (
      <div className="Main">
        <Menu/>
        <Expiriences/>
      </div>
  );
}
