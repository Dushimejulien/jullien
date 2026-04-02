import React, { useState, useEffect } from 'react';
import {  Container, Row, Col, Card } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

const MyShop = () => {
 
  const [totalCostPrice, setTotalCostPrice] = useState(0);
  const [totalQuantityInStock, setTotalQuantityInStock] = useState(0);

  useEffect(() => {
    // Fetch data from your API when the component mounts
    fetch('/api/products/myshop')
      .then((response) => response.json())
      .then((data) => {
        setTotalCostPrice(data.totalCostPrice);
        setTotalQuantityInStock(data.totalQuantityInStock);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
<Helmet>My shop</Helmet>
      <h1 style={{textAlign:"center"}}>Shop cost</h1>
    <Container className='small-container' style={{marginTop:"3rem"}}>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>Shop summary</h3>
            </Card.Header>
            <Card.Body>
            <Row>
                    <Col>
                    Total Items in Stock
                    </Col>
                    <Col  ><strong>{totalQuantityInStock}{" "}</strong>Items</Col>
                </Row>
                <Row style={{marginTop:"2rem"}}>
                    <Col>
              <p>Total shop Cost</p>
                    </Col>
                    <Col>
              <p style={{textDecoration:"underline"}}><strong>{totalCostPrice}{" "}</strong>RWF</p>
                    </Col>
                </Row>
                
              
              
            </Card.Body>
            <Card.Body>
                
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default MyShop;
