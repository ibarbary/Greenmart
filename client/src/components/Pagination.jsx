import leftArr from "../assets/less-than-symbol.png";
import rightArr from "../assets/greater-than-symbol.png";

function Pagination({ currentPage, totalPages, setCurrentPage }) {
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const windowSize = 5;
  let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let endPage = startPage + windowSize - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - windowSize + 1);
  }

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="flex items-center justify-between w-full max-w-80 text-gray-500 font-medium">
      <button
        type="button"
        aria-label="prev"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className={`rounded-full p-2 shadow-sm ${
          currentPage === 1
            ? "bg-slate-100 opacity-50 cursor-default"
            : "cursor-pointer transition duration-200 bg-slate-100 hover:bg-slate-200"
        }`}
      >
        <img src={leftArr} alt="Previous" className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 text-sm font-medium">
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => {
              goToPage(page);
            }}
            className={`h-10 w-10 flex items-center justify-center aspect-square  ${
              currentPage === page ? "text-primary" : "cursor-pointer"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="next"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className={`rounded-full p-2 shadow-sm ${
          currentPage === totalPages
            ? "bg-slate-100 opacity-50 cursor-default"
            : "cursor-pointer transition duration-200 bg-slate-100 hover:bg-slate-200"
        }`}
      >
        <img src={rightArr} alt="Next" className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Pagination;
