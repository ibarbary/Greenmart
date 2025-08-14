import { useState, useEffect } from "react";
import axios from "../../Utils/axiosInstance.js";
import toast from "react-hot-toast";
import eye from "../../assets/see.png";
import Pagination from "../../components/Pagination.jsx";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [complaintsCurrentPage, setComplaintsCurrentPage] = useState(1);
  const [complaintsTotalCount, setComplaintsTotalCount] = useState(0);
  const [complaintsTotalPages, setComplaintsTotalPages] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const COMPLAINTS_PER_PAGE = 100;

  useEffect(() => {
    fetchComplaints();
  }, [complaintsCurrentPage]);

  async function fetchComplaints(currentPage = complaintsCurrentPage) {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("'From' date must be earlier than 'To' date.");
      return;
    }

    if (currentPage == 1) setComplaintsCurrentPage(currentPage);

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        limit: COMPLAINTS_PER_PAGE,
        offset: (currentPage - 1) * COMPLAINTS_PER_PAGE,
        status: selectedStatus || "",
        from: fromDate,
        to: toDate,
      }).toString();
      const { data } = await axios.get(`/api/complaints?${query}`);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setComplaints(data.complaints);
      setComplaintsTotalCount(data.totalCount);
      setComplaintsTotalPages(Math.ceil(data.totalCount / COMPLAINTS_PER_PAGE));
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateComplaintStatus(status) {
    if (status === "accepted") setIsAccepting(true);
    if (status === "rejected") setIsRejecting(true);

    try {
      await axios.put(`/api/complaints/${selectedComplaint.id}/status`, {
        status,
        orderId: selectedComplaint.orderId,
        userId: selectedComplaint.userId,
      });

      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      console.error("Failed to update complaint:", error);
      toast.error("Failed to update complaint");
    } finally {
      if (status === "accepted") setIsAccepting(false);
      if (status === "rejected") setIsRejecting(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#000000";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-wrap gap-4 mt-4 md:pl-10 pl-4 items-center">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="fromDate" className="text-sm">
            From:
          </label>
          <input
            id="fromDate"
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="toDate" className="text-sm">
            To:
          </label>
          <input
            id="toDate"
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            fetchComplaints(1);
          }}
          className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-primary-darker cursor-pointer transition-all"
        >
          Apply Filters
        </button>
      </div>

      <div className="md:p-10 p-4 space-y-4">
        <div className="flex items-center justify-between pb-4 text-lg font-medium max-w-5xl w-full">
          <h1>Customer Complaints</h1>
          <span className="text-sm text-gray-500">
            {complaintsTotalCount} complaints found
          </span>
        </div>

        <div className="space-y-4 max-w-5xl">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-300 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            : complaints?.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="flex gap-4">
                    <img
                      src={complaint.productImage}
                      alt={complaint.productName}
                      className="w-18 h-18 rounded object-contain"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {complaint.productName}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                              Order #{complaint.orderId}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              Customer #{complaint.userId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-1 text-xs font-semibold rounded-full"
                            style={{
                              color: getStatusColor(complaint.status),
                              backgroundColor:
                                getStatusColor(complaint.status) + "20",
                            }}
                          >
                            {complaint.status.charAt(0).toUpperCase() +
                              complaint.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        {complaint.description.substring(0, 150)}
                        {complaint.description.length > 150 && "..."}
                      </p>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          Submitted: {formatDate(complaint.created_at)}
                        </span>
                        <div className="relative group">
                          <img
                            className="w-6 h-6 cursor-pointer"
                            src={eye}
                            alt="viewProduct"
                            onClick={() => setSelectedComplaint(complaint)}
                          />
                          <span className="absolute right-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex px-2 py-1 text-xs text-white bg-black rounded shadow-md z-10">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {selectedComplaint && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Complaint Details
                  </h2>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-2xl cursor-pointer"
                  >
                    x
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedComplaint.productImage}
                      alt={selectedComplaint.productName}
                      className="w-20 h-20 object-contain rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedComplaint.productName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Category: {selectedComplaint.productCategory}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: ${selectedComplaint.productPrice}
                      </p>
                      <p className="text-sm text-gray-600">
                        Item ID: #{selectedComplaint.orderItemId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Order ID: #{selectedComplaint.orderId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Customer's Complaint:
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.image && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Attached Image:
                    </h4>
                    <img
                      src={selectedComplaint.image}
                      alt="Complaint evidence"
                      className="max-w-full h-60 object-fit rounded-lg"
                    />
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Timeline:
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Submitted: {formatDate(selectedComplaint.created_at)}</p>
                  </div>
                </div>

                {selectedComplaint.status === "pending" ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateComplaintStatus("rejected")}
                      disabled={isRejecting}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isRejecting ? "Processing..." : "Reject Complaint"}
                    </button>
                    <button
                      onClick={() => updateComplaintStatus("accepted")}
                      disabled={isAccepting}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isAccepting ? "Processing..." : "Accept Refund"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span
                      className="px-4 py-2 rounded-lg font-semibold"
                      style={{
                        color: getStatusColor(selectedComplaint.status),
                        backgroundColor:
                          getStatusColor(selectedComplaint.status) + "20",
                      }}
                    >
                      This complaint has been {selectedComplaint.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {complaintsTotalPages > 1 ? (
        <div className="mb-10 md:px-10 px-4 ">
          <div className="flex justify-between">
            <Pagination
              currentPage={complaintsCurrentPage}
              totalPages={complaintsTotalPages}
              setCurrentPage={setComplaintsCurrentPage}
            />
            <div className="text-sm text-gray-500">
              Page {complaintsCurrentPage} of {complaintsTotalPages}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Complaints;
