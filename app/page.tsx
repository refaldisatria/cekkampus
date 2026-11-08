import { redirect } from "next/navigation";
// The clickable prototype UI lives in /public/prototype.html until it is ported to React.
export default function Home() {
  redirect("/prototype.html");
}
