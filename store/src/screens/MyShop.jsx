import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

const MyShop = () => {
  const [totalCostPrice, setTotalCostPrice] = useState(0);
  const [totalQuantityInStock, setTotalQuantityInStock] = useState(0);

  useEffect(() => {
    fetch('/api/products/myshop')
      .then((response) => response.json())
      .then((data) => {
        setTotalCostPrice(data.totalCostPrice);
        setTotalQuantityInStock(data.totalQuantityInStock);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <Container className="py-5">
      <Helmet>
        <title>Shop Valuation - Rightlamps</title>
      </Helmet>
      
      <div className="text-center mb-5">
        <h1 className="text-gradient">Shop Capital & Inventory</h1>
        <p className="text-muted">High-level summary of current stock valuation and volume</p>
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-lg bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-primary text-white p-4 border-0">
               <h4 className="mb-0 fw-bold">Executive Inventory Summary</h4>
             </Card.Header>
             <Card.Body className="p-4">
               <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-light">
                 <div>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Total Stock Count</div>
                   <div className="display-6 fw-bold text-primary">{totalQuantityInStock} <span className="fs-6 fw-normal text-muted">Units</span></div>
                 </div>
                 <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary">
                    <i className="fas fa-boxes fs-3"></i>
                 </div>
               </div>

               <div className="d-flex justify-content-between align-items-center">
                 <div>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Total Asset Valuation</div>
                   <div className="display-6 fw-bold">{(totalCostPrice || 0).toLocaleString()} <span className="fs-6 fw-normal text-muted">RWF</span></div>
                 </div>
                 <div className="p-3 bg-success bg-opacity-10 rounded-circle text-success">
                    <i className="fas fa-calculator fs-3"></i>
                 </div>
               </div>

               <div className="mt-5 p-3 rounded-3 bg-light border-start border-4 border-primary small text-muted">
                 <i className="fas fa-info-circle me-2"></i> This data reflects the acquisition cost of all active inventory items currently stored in the system.
               </div>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MyShop;
