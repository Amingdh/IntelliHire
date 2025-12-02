import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                <p className="text-2xl font-bold text-gradient">IntelliHire</p>
                <span className="nav-tagline">AI Resume Intelligence</span>
            </Link>
            <div className="nav-actions">
                <a href="#insights" className="secondary-button hidden md:inline-flex">
                    View Insights
                </a>
                <Link to="/upload" className="primary-button nav-cta">
                    Upload Resume
                </Link>
            </div>
        </nav>
    )
}
export default Navbar
