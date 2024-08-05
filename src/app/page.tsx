
import Main from "./components/Partial/Main";
import Menu from "./components/Partial/Menu";
import Nav from "./components/Partial/Nav";
export default function Home() {
  return (
    <div className="Parent">
      <Nav />
      <Menu />
      <Main />
    </div>
  );
}
