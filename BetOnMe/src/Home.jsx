import "./Home.css";

function Home() {
  return (
    <div className="container">
      
      {/* LEFT LARGE BOX */}
      <div className="box large">
        <h2>Current Goal</h2>
        <p>Finish studying React fundamentals</p>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column">

        <div className="box small">
          <h3>Add Goal</h3>
          <button>Add +</button>
        </div>

        <div className="box small">
          <h3>Completion Ratio</h3>
          <p>7 / 10 goals completed</p>
        </div>

      </div>

      {/* BOTTOM WIDE BOX */}
      <div className="box wide">
        <h3>Future Feature / Stats / Activity</h3>
      </div>

    </div>
  );
}

export default Home;