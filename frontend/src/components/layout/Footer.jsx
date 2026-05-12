import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer-dark">
      <div className="container footer-grid">
        <div className="footer-col brand-col">
          <h2 className="brand mb-1 text-white text-lg uppercase tracking-tighter">GOTICKET</h2>
          <p className="text-light-dim text-xs mt-2 leading-relaxed">
            Premium sports editorial and ticketing destination.
          </p>
          <p className="copy-text text-xs mt-6">&copy; 2026 GoTicket Editorial. All rights reserved.</p>
        </div>

        <div className="footer-col text-sm">
          <h4 className="footer-head">QUICK LINKS</h4>
          <Link to="/">About Us</Link>
          <Link to="/">Contact</Link>
          <Link to="/">Support</Link>
          <Link to="/">Press</Link>
        </div>

        <div className="footer-col text-sm">
          <h4 className="footer-head">LEGAL</h4>
          <Link to="/">Terms of Service</Link>
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Refund Policy</Link>
        </div>

        <div className="footer-col news-col">
          <h4 className="footer-head">NEWSLETTER</h4>
          <p className="text-light-dim text-xs mb-3">Get the latest match alerts.</p>
          <div className="newsletter-form h-9">
            <input type="email" placeholder="Email Address" className="newsletter-input text-xs" />
            <button type="submit" className="newsletter-btn px-3 text-xs">➤</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
