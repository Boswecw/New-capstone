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
          ...filters,
        });

        const response = await api.get(`/admin/contacts?${params.toString()}`);
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

  // ... rest of the component remains the same as in the previous response
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
      await api.put(`/admin/contacts/${selectedContact._id}/respond`, {
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
      await api.put(`/admin/contacts/${contactId}/status`, { status });
      fetchContacts();
    } catch (error) {
      console.error("Error updating contact status:", error);
    }
  };

  const handleStatusChange = async (contact, newStatus) => {
    try {
      await api.put(`/admin/contacts/${contact._id}/status`, {
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
    setFilters({ status: "" });
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
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card>
        <Card.Body>
          <DataTable
            data={contacts}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => fetchContacts(page)}
            rowActions={[
              {
                label: "View",
                onClick: handleView,
                variant: "info",
              },
              {
                label: "Respond",
                onClick: handleRespond,
                variant: "success",
              },
            ]}
          />
        </Card.Body>
      </Card>

      {/* View Contact Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
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
                <strong>Message:</strong> {selectedContact.message}
              </p>
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
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Respond Modal */}
      <Modal
        show={showResponseModal}
        onHide={() => setShowResponseModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Respond to Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Response Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Type your response here..."
            />
          </Form.Group>
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
