import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Pagination,
  Button, Badge, Modal, Form, Alert, Spinner, InputGroup
} from 'react-bootstrap';
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';

const Report= () => {
  const [reports, setReports] = useState([]);
    const { state } = useContext(Store);
    const { userInfo } = state;
     const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [allSelectedOnPage, setAllSelectedOnPage] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Load selected reports from localStorage on component mount
  useEffect(() => {
    const savedSelections = localStorage.getItem('selectedReports');
    if (savedSelections) {
      try {
        setSelectedReports(new Set(JSON.parse(savedSelections)));
      } catch (e) {
        console.error('Error loading selections from localStorage:', e);
      }
    }
  }, []);
console.log(reports.reportItems);

  // Save selected reports to localStorage whenever they change
  // useEffect(() => {
  //   localStorage.setItem('selectedReports', JSON.stringify(Array.from(selectedReports)));
  // }, [selectedReports]);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  useEffect(() => {
    // Check if all reports on current page are selected
    const currentPageReportIds = reports.map(report => report._id);
    const allSelected = currentPageReportIds.length > 0 && 
                        currentPageReportIds.every(id => selectedReports.has(id));
    setAllSelectedOnPage(allSelected);
  }, [reports, selectedReports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = userInfo.token;
      const response = await axios.get(`/api/report/all?page=${currentPage}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Reverse the array to display from oldest to newest
      const sortedReports = [...response.data.reports].reverse();
      
      setReports(sortedReports);
      setTotalPages(response.data.pages);
    } catch (err) {
      setError('Failed to fetch reports. Please try again.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

 

  const handleBulkDeleteClick = () => {
    if (selectedReports.size === 0) {
      setDeleteError('Please select at least one report to delete.');
      return;
    }
    setShowDeleteModal(true);
    setDeleteError('');
    setSuccessMessage('');
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      
      const token = userInfo.token;
      
      if (selectedReport) {
        // Single delete - using the existing endpoint
        await axios.delete(`/api/report/${selectedReport._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Remove from selections if it was selected
        const newSelections = new Set(selectedReports);
        newSelections.delete(selectedReport._id);
        setSelectedReports(newSelections);
        
        setSuccessMessage('Report deleted successfully!');
      } else if (selectedReports.size > 0) {
        // Bulk delete - using the new endpoint
        setBulkDeleteLoading(true);
        
        // Convert Set to Array for the API call
        const reportIds = Array.from(selectedReports);
        
        await axios.delete('/api/report', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: { reportIds } // Note: using data instead of params for DELETE with body
        });
        
        setSelectedReports(new Set());
        setSuccessMessage(`${reportIds.length} report(s) deleted successfully!`);
      }
      
      setShowDeleteModal(false);
      fetchReports(); // Refresh the list
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete report(s). Please try again.');
      console.error('Error deleting report(s):', err);
    } finally {
      setDeleteLoading(false);
      setBulkDeleteLoading(false);
    }
  };


  const toggleReportSelection = (reportId) => {
    const newSelections = new Set(selectedReports);
    if (newSelections.has(reportId)) {
      newSelections.delete(reportId);
    } else {
      newSelections.add(reportId);
    }
    setSelectedReports(newSelections);
  };

  const toggleSelectAll = () => {
    const currentPageReportIds = reports.map(report => report._id);
    
    if (allSelectedOnPage) {
      // Deselect all on current page
      const newSelections = new Set(selectedReports);
      currentPageReportIds.forEach(id => newSelections.delete(id));
      setSelectedReports(newSelections);
    } else {
      // Select all on current page
      const newSelections = new Set(selectedReports);
      currentPageReportIds.forEach(id => newSelections.add(id));
      setSelectedReports(newSelections);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  };

  const renderPaginationItems = () => {
    let items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    // Page numbers - show up to 5 pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 30);
    
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading reports...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Sales Reports</h3>
              </div>
              <div className="d-flex align-items-center">
                <Badge bg="secondary" className="me-3">
                  {reports.length} reports on this page
                </Badge>
                {selectedReports.size > 0 && (
                  <Badge bg="primary">
                    {selectedReports.size} selected
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              
              {reports.length === 0 ? (
                <Alert variant="info" className="text-center">
                  No reports found.
                </Alert>
              ) : (
                <>
                  <div className="d-flex justify-content-between mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Select all on this page"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAll}
                    />
                    {selectedReports.size > 0 && (
                      <Button
                        variant="outline-danger"
                        onClick={handleBulkDeleteClick}
                        disabled={bulkDeleteLoading}
                      >
                        {bulkDeleteLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-1"
                            />
                            Deleting...
                          </>
                        ) : (
                          `Delete Selected (${selectedReports.size})`
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                          <th>#</th>
                          <th>Items</th>
                          <th>Sales</th>
                          <th>Costs</th>
                          <th>Profit</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report, index) => (
                          <tr key={report._id} className={selectedReports.has(report._id) ? 'table-active' : ''}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedReports.has(report._id)}
                                onChange={() => toggleReportSelection(report._id)}
                              />
                            </td>
                            <td>{(currentPage - 1) * limit + index + 1}</td>
                            <td>
                              <div>
                                {report.reportItems.slice(0, 2).map((item, i) => (
                                  <div key={i} className="d-flex align-items-center mb-1">
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      style={{ width: '30px', height: '30px', objectFit: 'cover', marginRight: '8px' }}
                                    />
                                    <span>{item.name} (x{item.quantity})</span>
                                  </div>
                                ))}
                                {report.reportItems.length > 2 && (
                                  <Badge bg="light" text="dark">
                                    +{report.reportItems.length - 2} more items
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>{formatCurrency(report.sales)}</td>
                            <td>{formatCurrency(report.costs)}</td>
                            <td>
                              <Badge bg={parseFloat(report.netProfit) >= 0 ? "success" : "danger"}>
                                {formatCurrency(report.netProfit)}
                              </Badge>
                            </td>
                            <td>
                              <Badge 
                                bg={
                                  report.status === "PAID" ? "success" : 
                                  report.status === "HALF-PAID" ? "warning" : "danger"
                                }
                              >
                                {report.status}
                              </Badge>
                            </td>
                            <td>{report.paymentMethod}</td>
                            <td>{formatDate(report.createdAt)}</td>
                            <td>
                             <Button
                        variant="info"
                        onClick={() => console.log("Wait")}
                      >
                        Details
                      </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        {renderPaginationItems()}
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedReport ? 'Confirm Delete' : `Delete ${selectedReports.size} Report(s)`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          {selectedReport ? (
            <p>Are you sure you want to delete this report from {formatDate(selectedReport.createdAt)}?</p>
          ) : (
            <p>Are you sure you want to delete {selectedReports.size} selected report(s)?</p>
          )}
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                Deleting...
              </>
            ) : (
              selectedReport ? 'Delete Report' : `Delete ${selectedReports.size} Report(s)`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Report;
