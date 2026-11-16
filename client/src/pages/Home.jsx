import { Link } from "react-router-dom";
import "./Home.css";
export default function Home() {
  return (
    <div className="textile-home">
      <section className="home-hero">
        <div className="home-copy">
          <span className="eyebrow">TEXTILE ORDER & INVENTORY MANAGEMENT</span>
          <h1>
            For Quality & Premium
            <br />
            Products of — <em>Home Textile.</em>
          </h1>
          <p>
            A clear overview of textile operations, order stages, inventory and
            delivery milestones for the entire team.
          </p>
          <Link className="home-cta" to="/login">
            Employee / Manager / Admin Login
          </Link>
        </div>
        <div className="home-visual">
          <div className="fabric-orb">
            TOIMS<span>TEXTILE OPERATIONS</span>
          </div>
        </div>
      </section>
      <section className="home-index">
        <div>
          <span>01 / SOURCING</span>
          <h3>Yarn & Raw Materials</h3>
          <p>Purchase planning, supplier coordination and inward tracking.</p>
        </div>
        <div>
          <span>02 / PRODUCTION</span>
          <h3>Process Overview</h3>
          <p>Knitting, dyeing, processing, finishing and quality checks.</p>
        </div>
        <div>
          <span>03 / DELIVERY</span>
          <h3>Shipment Readiness</h3>
          <p>Packing, documentation, dispatch and order closure.</p>
        </div>
      </section>
      <footer className="home-footer">
        TOIMS · Textile operations at a glance
      </footer>
    </div>
  );
}
