
import Main from "./components/Partial/Main";
import Menu from "./components/Partial/Menu";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Home() {
  return (
      <div className="Parent">
        <Menu/>
        <Main/>
      </div>
  );
}
