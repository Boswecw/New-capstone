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

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    type: "",
    status: "",
    available: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPet, setDeletingPet] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  const fetchPets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 10,
          ...filters,
        });

        const response = await api.get(`/admin/pets?${params.toString()}`);
        setPets(response.data.data);
        setPagination(response.data.pagination);
      } catch (error) {
        showAlert("Error fetching pets", "danger");
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000);
  };

  const handleEdit = (pet) => {
    setEditingPet({
      ...pet,
      originalPet: pet,
    });
    setShowEditModal(true);
  };

  const handleDelete = (pet) => {
    setDeletingPet(pet);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { originalPet, ...updateData } = editingPet;
      await api.put(`/admin/pets/${editingPet._id}`, updateData);
      showAlert("Pet updated successfully", "success");
      setShowEditModal(false);
      setEditingPet(null);
      fetchPets();
    } catch (error) {
      showAlert("Error updating pet", "danger");
      console.error("Error updating pet:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/admin/pets/${deletingPet._id}`);
      showAlert("Pet deleted successfully", "success");
      setShowDeleteModal(false);
      setDeletingPet(null);
      fetchPets();
    } catch (error) {
      showAlert("Error deleting pet", "danger");
      console.error("Error deleting pet:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      type: "",
      status: "",
      available: "",
    });
  };

  // Helper function to get badge variant for type
  const getTypeBadgeVariant = (value) => {
    const variants = {
      dog: "primary",
      cat: "success",
      fish: "info",
      bird: "warning",
      "small-pet": "secondary",
      supply: "dark",
    };
    return variants[value] || "primary";
  };

  // Helper function to normalize type display
  const normalizeTypeDisplay = (type) => {
    if (type === "small-pet") {
      return "Small Pet";
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const columns = [
    {
      header: "Image",
      accessor: "image",
      render: (pet) => (
        <img
          src={pet.image}
          alt={pet.name}
          className="rounded"
          style={{ width: "60px", height: "60px", objectFit: "cover" }}
        />
      ),
    },
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Type",
      accessor: "type",
      type: "badge",
      badgeVariant: getTypeBadgeVariant,
      render: (pet) => (
        <Badge bg={getTypeBadgeVariant(pet.type)}>
          {normalizeTypeDisplay(pet.type)}
        </Badge>
      ),
    },
    {
      header: "Breed",
      accessor: "breed",
    },
    {
      header: "Age",
      accessor: "age",
    },
    {
      header: "Size",
      accessor: "size",
      render: (pet) => (
        <Badge variant="outline-secondary" className="text-capitalize">
          {pet.size}
        </Badge>
      ),
    },
    {
      header: "Gender",
      accessor: "gender",
      render: (pet) => (
        <span className="text-capitalize">{pet.gender || "Unknown"}</span>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      render: (pet) => (pet.price ? `$${pet.price.toLocaleString()}` : "N/A"),
    },
    {
      header: "Status",
      accessor: "available",
      type: "badge",
      badgeVariant: (value) => (value ? "success" : "danger"),
      render: (pet) => (
        <Badge bg={pet.available ? "success" : "danger"}>
          {pet.available ? "Available" : "Adopted"}
        </Badge>
      ),
    },
    {
      header: "Votes",
      accessor: "votes",
      render: (pet) => (
        <div>
          <span className="text-success">
            <i className="fas fa-thumbs-up"></i> {pet.votes?.up || 0}
          </span>
          <span className="text-danger ms-2">
            <i className="fas fa-thumbs-down"></i> {pet.votes?.down || 0}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "createdAt",
      type: "date",
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="fas fa-paw me-2"></i>Pet Management
        </h1>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Enhanced Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name or breed..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
                <option value="fish">Fish</option>
                <option value="bird">Birds</option>
                <option value="small-pet">Small Pets</option>
                <option value="supply">Supplies</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="aquatic">Aquatic</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Availability</Form.Label>
              <Form.Select
                value={filters.available}
                onChange={(e) =>
                  handleFilterChange("available", e.target.value)
                }
              >
                <option value="">All</option>
                <option value="true">Available</option>
                <option value="false">Adopted</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="adopted">Adopted</option>
              </Form.Select>
            </Col>
            <Col md={1} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={clearFilters}
                size="sm"
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card>
        <Card.Body>
          <DataTable
            data={pets}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={pagination}
            onPageChange={fetchPets}
            loading={loading}
          />
        </Card.Body>
      </Card>

      {/* Edit Pet Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Pet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingPet && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingPet.name || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, name: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={editingPet.type || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, type: e.target.value })
                      }
                    >
                      <option value="">Select Type</option>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="fish">Fish</option>
                      <option value="bird">Bird</option>
                      <option value="small-pet">Small Pet</option>
                      <option value="supply">Supply</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Breed</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingPet.breed || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, breed: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Age</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingPet.age || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, age: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Select
                      value={editingPet.size || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, size: e.target.value })
                      }
                    >
                      <option value="">Select Size</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={editingPet.gender || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, gender: e.target.value })
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price ($)</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingPet.price || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, price: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingPet.description || ""}
                  onChange={(e) =>
                    setEditingPet({
                      ...editingPet,
                      description: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Image URL</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingPet.image || ""}
                      onChange={(e) =>
                        setEditingPet({ ...editingPet, image: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Available</Form.Label>
                    <Form.Check
                      type="switch"
                      id="available-switch"
                      checked={editingPet.available || false}
                      onChange={(e) =>
                        setEditingPet({
                          ...editingPet,
                          available: e.target.checked,
                        })
                      }
                      label={
                        editingPet.available ? "Available" : "Not Available"
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deletingPet && (
            <div>
              <p>
                Are you sure you want to delete{" "}
                <strong>{deletingPet.name}</strong>?
              </p>
              <p className="text-muted">This action cannot be undone.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Pet
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminPets;
