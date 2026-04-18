import "./Landingpage.css";

export default function Landing() {
  return (
    <div className="lp">

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
        <div className="site-title">BetOnMe</div>
        <h1 className="headline">Real Steps, Real Money</h1>
        <p className="subtext">
          Put your money where your mind is. Use BetonMe to make bets on yourself towards goals
          that matter to you. Stash away some money and gather it back as a reward once you've completed your goal.
          Fail your goal? Don't worry, your money goes towards a charitable foundation of your choice. Win-win.
        </p>
        </div>
      </section>

      {/* Photo + description section */}
      <section className="photos-section">
        <div className="photos-grid">
          <div className="photo-card">
            <div className="photo-placeholder">
              {/* Replace with: <img src="your-image.jpg" alt="description" /> */}
              Photo 1
            </div>
            <h3>Add a bet</h3>
            <p>Choose your goal, focus, and check in when you're done.</p>
          </div>
          <div className="photo-card">
            <div className="photo-placeholder">
              Photo 2
            </div>
            <h3>Prove yourself right</h3>
            <p>Keep track of how many goals you've completed in a row and your record.</p>
          </div>
          <div className="photo-card">
            <div className="photo-placeholder">
              
            </div>
            <h3>Track your habits</h3>
            <p>Complete your goal, get paid back.</p>
          </div>
        </div>
      </section>

      {/* Additional info section */}
      <section className="contact-section">
        <h2>More Information For You</h2>
        <p>Have questions or want early access? Drop us a message.</p>

        
      </section>

      <footer className="footer">
        © 2026 BetonMe · Privacy · Terms
      </footer>
    </div>
  );
}