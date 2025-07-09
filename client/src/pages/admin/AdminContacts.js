import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import DataTable from "../../components/DataTable";
import api from "../../services/api";

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  const fetchContacts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 10,
          // Only include non-empty filter values
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        });

        // Fixed: Use /contact route instead of /admin/contacts
        const response = await api.get(`/contact?${params.toString()}`);
        setContacts(response.data.data);
        setPagination(response.data.pagination);
      } catch (error) {
        showAlert("Error fetching contacts", "danger");
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000);
  };

  const handleView = (contact) => {
    setSelectedContact(contact);
    setShowViewModal(true);

    // Mark as read if it's new
    if (contact.status === "new") {
      updateContactStatus(contact._id, "read");
    }
  };

  const handleRespond = (contact) => {
    setSelectedContact(contact);
    setResponseMessage("");
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    try {
      if (!responseMessage.trim()) {
        showAlert("Please enter a response message", "warning");
        return;
      }

      // Fixed: Use /contact route instead of /admin/contacts
      await api.put(`/contact/${selectedContact._id}/respond`, {
        message: responseMessage,
      });
      showAlert("Response sent successfully", "success");
      setShowResponseModal(false);
      setSelectedContact(null);
      setResponseMessage("");
      fetchContacts();
    } catch (error) {
      showAlert("Error sending response", "danger");
      console.error("Error sending response:", error);
    }
  };

  const updateContactStatus = async (contactId, status) => {
    try {
      // Fixed: Use /contact route instead of /admin/contacts
      await api.put(`/contact/${contactId}/status`, { status });
      fetchContacts();
    } catch (error) {
      console.error("Error updating contact status:", error);
    }
  };

  const handleStatusChange = async (contact, newStatus) => {
    try {
      // Fixed: Use /contact route instead of /admin/contacts
      await api.put(`/contact/${contact._id}/status`, {
        status: newStatus,
      });
      showAlert("Contact status updated", "success");
      fetchContacts();
    } catch (error) {
      showAlert("Error updating status", "danger");
      console.error("Error updating status:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", search: "" });
  };

  const handleDelete = async (contact) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await api.delete(`/contact/${contact._id}`);
        showAlert("Contact deleted successfully", "success");
        fetchContacts();
      } catch (error) {
        showAlert("Error deleting contact", "danger");
        console.error("Error deleting contact:", error);
      }
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      new: "primary",
      read: "info",
      responded: "success",
      resolved: "secondary",
    };
    return variants[status] || "primary";
  };

  const columns = [
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Message",
      accessor: "message",
      render: (contact) => (
        <div style={{ maxWidth: "200px" }}>
          {contact.message.length > 50
            ? `${contact.message.substring(0, 50)}...`
            : contact.message}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (contact) => (
        <Form.Select
          size="sm"
          value={contact.status}
          onChange={(e) => handleStatusChange(contact, e.target.value)}
          style={{ width: "120px" }}
        >
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="responded">Responded</option>
          <option value="resolved">Resolved</option>
        </Form.Select>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      type: "date",
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (contact) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleView(contact)}
          >
            <i className="fas fa-eye"></i>
          </Button>
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => handleRespond(contact)}
          >
            <i className="fas fa-reply"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(contact)}
          >
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="fas fa-envelope me-2"></i>Contact Management
        </h1>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
                <option value="resolved">Resolved</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name, email, subject..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contacts Table */}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={contacts}
            loading={loading}
            pagination={pagination}
            onPageChange={fetchContacts}
            emptyMessage="No contacts found"
          />
        </Card.Body>
      </Card>

      {/* View Contact Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Contact Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContact && (
            <>
              <p>
                <strong>Name:</strong> {selectedContact.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedContact.email}
              </p>
              <p>
                <strong>Subject:</strong> {selectedContact.subject}
              </p>
              <p>
                <strong>Message:</strong>
              </p>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "15px",
                }}
              >
                {selectedContact.message}
              </div>
              <p>
                <strong>Status:</strong>{" "}
                <Badge bg={getStatusVariant(selectedContact.status)}>
                  {selectedContact.status}
                </Badge>
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedContact.createdAt).toLocaleString()}
              </p>
              {selectedContact.response && (
                <>
                  <hr />
                  <h6>Response:</h6>
                  <div
                    style={{
                      background: "#e7f3ff",
                      padding: "15px",
                      borderRadius: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    {selectedContact.response.message}
                  </div>
                  <small className="text-muted">
                    Responded by {selectedContact.response.respondedBy?.name} on{" "}
                    {new Date(selectedContact.response.respondedAt).toLocaleString()}
                  </small>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {selectedContact && selectedContact.status !== "responded" && (
            <Button
              variant="primary"
              onClick={() => {
                setShowViewModal(false);
                handleRespond(selectedContact);
              }}
            >
              Respond
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Respond Modal */}
      <Modal
        show={showResponseModal}
        onHide={() => setShowResponseModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Respond to Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContact && (
            <>
              <div className="mb-3">
                <strong>Original Message:</strong>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "5px",
                    marginTop: "5px",
                  }}
                >
                  {selectedContact.message}
                </div>
              </div>
              <Form.Group>
                <Form.Label>Your Response</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response here..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResponseModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendResponse}
            disabled={!responseMessage.trim()}
          >
            Send Response
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminContacts;