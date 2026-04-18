import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import "./Landingpage.css";

export default function Landing() {
  return (
    <div>
      <section className="title">
        <h1>BetonMe</h1>
        <h2>Real Steps, Real Money</h2>
      </section>

      <hr className="divider" />

      <section className="features">
     {/*Add photos and descr.*/}
      </section>

      <hr className="divider" />

      <section className="testimonial">
      </section>

      <hr className="divider" />

      <section className="cta">
      </section>

      <footer className="footer">
        © 2026 BetonMe · Privacy · Terms
      </footer>
    </div>
  );
}