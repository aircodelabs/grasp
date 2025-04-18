import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/live");
  }, [navigate]);

  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
