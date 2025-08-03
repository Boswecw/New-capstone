// client/src/pages/admin/AdminNews.js - FIXED VERSION
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  Form,
  Card,
  InputGroup,
  Dropdown
} from "react-bootstrap";
import { newsAPI } from "../../services/api";

const AdminNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'general',
    featured: false,
    imageUrl: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    source: 'custom'
  });

  // ✅ Load articles with proper error handling
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 AdminNews: Loading custom articles...');
      
      // ✅ Use the consolidated API
      const response = await newsAPI.getCustomNews({
        search: filters.search,
        category: filters.category === 'all' ? undefined : filters.category,
        limit: 100
      });
      
      if (response?.data?.success && response.data.data) {
        setArticles(response.data.data);
        console.log(`✅ AdminNews: Loaded ${response.data.data.length} articles`);
      } else if (response?.data && Array.isArray(response.data)) {
        setArticles(response.data);
        console.log(`✅ AdminNews: Loaded ${response.data.length} articles (array format)`);
      } else {
        setError("No articles found");
        setArticles([]);
      }
    } catch (err) {
      console.error("❌ AdminNews: Error loading articles:", err);
      setError(`Failed to load articles: ${err.message}`);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // ✅ Create new article
  const handleCreateArticle = async () => {
    try {
      if (!newArticle.title.trim() || !newArticle.content.trim()) {
        setError("Title and content are required");
        return;
      }

      setLoading(true);
      
      const response = await newsAPI.createArticle(newArticle);
      
      if (response?.data?.success) {
        console.log('✅ Article created successfully');
        setShowCreateModal(false);
        setNewArticle({
          title: '',
          content: '',
          summary: '',
          category: 'general',
          featured: false,
          imageUrl: ''
        });
        // Reload articles
        await loadArticles();
      } else {
        setError("Failed to create article");
      }
    } catch (err) {
      console.error("❌ Error creating article:", err);
      setError(`Failed to create article: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle publish status
  const togglePublish = async (article) => {
    try {
      const updatedArticle = { ...article, published: !article.published };
      
      const response = await newsAPI.updateArticle(article.id, updatedArticle);
      
      if (response?.data?.success) {
        setArticles(prev => 
          prev.map(a => a.id === article.id ? updatedArticle : a)
        );
        console.log(`✅ Article ${updatedArticle.published ? 'published' : 'unpublished'}`);
      } else {
        setError("Failed to update article status");
      }
    } catch (err) {
      console.error("❌ Error updating article:", err);
      setError(`Failed to update article: ${err.message}`);
    }
  };

  // ✅ Toggle featured status
  const toggleFeatured = async (article) => {
    try {
      const updatedArticle = { ...article, featured: !article.featured };
      
      const response = await newsAPI.updateArticle(article.id, updatedArticle);
      
      if (response?.data?.success) {
        setArticles(prev => 
          prev.map(a => a.id === article.id ? updatedArticle : a)
        );
        console.log(`✅ Article ${updatedArticle.featured ? 'marked as featured' : 'removed from featured'}`);
      } else {
        setError("Failed to update featured status");
      }
    } catch (err) {
      console.error("❌ Error updating featured status:", err);
      setError(`Failed to update featured status: ${err.message}`);
    }
  };

  // ✅ Delete article
  const handleDelete = async () => {
    try {
      if (!selectedArticle) return;

      const response = await newsAPI.deleteArticle(selectedArticle.id);
      
      if (response?.data?.success) {
        setArticles(prev => prev.filter(a => a.id !== selectedArticle.id));
        setShowDeleteModal(false);
        setSelectedArticle(null);
        console.log('✅ Article deleted successfully');
      } else {
        setError("Failed to delete article");
      }
    } catch (err) {
      console.error("❌ Error deleting article:", err);
      setError(`Failed to delete article: ${err.message}`);
    }
  };

  // ✅ Confirm delete
  const confirmDelete = (article) => {
    setSelectedArticle(article);
    setShowDeleteModal(true);
  };

  // ✅ Format date for display
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // ✅ Get category badge variant
  const getCategoryVariant = (category) => {
    const variants = {
      'success-story': 'success',
      'company-news': 'primary',
      'care': 'info',
      'safety': 'warning',
      'adoption': 'danger',
      'health': 'info'
    };
    return variants[category] || 'secondary';
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-newspaper text-primary me-2"></i>
                News Management
              </h2>
              <p className="text-muted mb-0">Manage custom articles and monitor external news sources</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <i className="fas fa-plus me-2"></i>
              Create Article
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search articles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="all">All Categories</option>
            <option value="company-news">Company News</option>
            <option value="success-story">Success Stories</option>
            <option value="care">Pet Care</option>
            <option value="health">Health</option>
            <option value="safety">Safety</option>
            <option value="adoption">Adoption</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Articles Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <h5 className="mt-3">Loading articles...</h5>
        </div>
      ) : (
        <Card>
          <Card.Body className="p-0">
            {articles.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-newspaper text-muted fa-3x mb-3"></i>
                <h5 className="text-muted">No articles found</h5>
                <p className="text-muted">Create your first article to get started</p>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th>Stats</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <div>
                          <strong>{article.title}</strong>
                          {article.featured && (
                            <Badge bg="warning" className="ms-2">
                              <i className="fas fa-star me-1"></i>Featured
                            </Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {article.summary || article.excerpt || 'No summary'}
                        </small>
                      </td>
                      <td>
                        <Badge bg={getCategoryVariant(article.category)}>
                          {article.category}
                        </Badge>
                      </td>
                      <td>
                        {article.published ? (
                          <Badge bg="success">
                            <i className="fas fa-check me-1"></i>Published
                          </Badge>
                        ) : (
                          <Badge bg="secondary">
                            <i className="fas fa-pause me-1"></i>Draft
                          </Badge>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(article.publishedAt)}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-3">
                          <small>
                            <i className="fas fa-eye text-muted me-1"></i>
                            {article.views || 0}
                          </small>
                          <small>
                            <i className="fas fa-heart text-muted me-1"></i>
                            {article.likes || 0}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <i className="fas fa-ellipsis-v"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => togglePublish(article)}>
                              <i className={`fas ${article.published ? 'fa-pause' : 'fa-play'} me-2`}></i>
                              {article.published ? 'Unpublish' : 'Publish'}
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => toggleFeatured(article)}>
                              <i className={`fas ${article.featured ? 'fa-star-o' : 'fa-star'} me-2`}></i>
                              {article.featured ? 'Remove Featured' : 'Make Featured'}
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => confirmDelete(article)}
                              className="text-danger"
                            >
                              <i className="fas fa-trash me-2"></i>
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Create Article Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-plus me-2"></i>
            Create New Article
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter article title"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="company-news">Company News</option>
                    <option value="success-story">Success Story</option>
                    <option value="care">Pet Care</option>
                    <option value="health">Health</option>
                    <option value="safety">Safety</option>
                    <option value="adoption">Adoption</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newArticle.summary}
                onChange={(e) => setNewArticle(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief summary (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={newArticle.content}
                onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Article content"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                value={newArticle.imageUrl}
                onChange={(e) => setNewArticle(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              id="featured-checkbox"
              label="Mark as featured article"
              checked={newArticle.featured}
              onChange={(e) => setNewArticle(prev => ({ ...prev, featured: e.target.checked }))}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateArticle}
            disabled={!newArticle.title.trim() || !newArticle.content.trim()}
          >
            <i className="fas fa-save me-2"></i>
            Create Article
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this article?</p>
          <div className="bg-light p-3 rounded">
            <strong>{selectedArticle?.title}</strong>
            <br />
            <small className="text-muted">This action cannot be undone.</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i className="fas fa-trash me-2"></i>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminNews;