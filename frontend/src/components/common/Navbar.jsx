function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-6">
      <h1 className="text-3xl font-bold text-blue-500">
        AegisCode
      </h1>

      <div className="flex gap-8 text-gray-300">
        <a href="#">Docs</a>
        <a href="#">Features</a>
        <a href="#">Login</a>
      </div>
    </nav>
  );
}

export default Navbar;