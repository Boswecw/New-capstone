// client/src/pages/admin/AdminNews.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
} from "react-bootstrap";
import { newsAPI } from "../../services/api";

const AdminNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await newsAPI.getAllNews({ source: "custom", limit: 50 });
      if (res.data?.success) {
        setArticles(res.data.data);
      } else {
        setError("Failed to load news articles");
      }
    } catch (err) {
      console.error("❌ Error loading news:", err);
      setError("Failed to load news articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const togglePublish = (id) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, published: !a.published } : a
      )
    );
    // Here you'd also send an API request to persist the change
  };

  const confirmDelete = (article) => {
    setSelectedArticle(article);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    setArticles((prev) => prev.filter((a) => a.id !== selectedArticle.id));
    setShowDeleteModal(false);
    // Here you'd also send an API request to delete from DB
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">📰 Admin News Management</h2>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
          <p>Loading articles...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published At</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>
                    <Badge bg="info">{a.category}</Badge>
                  </td>
                  <td>
                    {a.published ? (
                      <Badge bg="success">Published</Badge>
                    ) : (
                      <Badge bg="secondary">Unpublished</Badge>
                    )}
                  </td>
                  <td>
                    {new Date(a.publishedAt).toLocaleDateString("en-US")}
                  </td>
                  <td>{a.views || 0}</td>
                  <td>{a.likes || 0}</td>
                  <td>
                    <Button
                      variant={a.published ? "warning" : "success"}
                      size="sm"
                      className="me-2"
                      onClick={() => togglePublish(a.id)}
                    >
                      {a.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => confirmDelete(a)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Article</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>{selectedArticle?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminNews;
