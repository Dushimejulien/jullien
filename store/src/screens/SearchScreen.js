import axios from "axios";
import React, { useEffect, useReducer, useState } from "react";
import { Col, Row, Button, Container, ListGroup, Card, Form, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import Rating from "../components/Rating";
import { getError } from "../utils";
import Product from "../components/products";
import { Store } from "../Store";
import { useContext } from "react";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        countProducts: action.payload.countProducts,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const prices = [
  { izina: "Under 500 RWF", value: "1-500" },
  { izina: "500 to 1,000 RWF", value: "500-1000" },
  { izina: "1,000 to 5,000 RWF", value: "1000-5000" },
  { izina: "5,000 to 10,000 RWF", value: "5000-10000" },
  { izina: "Above 10,000 RWF", value: "10000-1000000" },
];

const ratings = [
  { izina: "4 & up", rating: 4 },
  { izina: "3 & up", rating: 3 },
  { izina: "2 & up", rating: 2 },
  { izina: "1 & up", rating: 1 },
];

export default function SearchScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const category = sp.get("category") || "all";
  const query = sp.get("query") || "all";
  const price = sp.get("price") || "all";
  const rating = sp.get("rating") || "all";
  const stock = sp.get("stock") || "all";
  const order = sp.get("order") || "newest";
  const page = sp.get("page") || 1;

  const [{ loading, error, products, pages, countProducts }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
          `/api/products/search?page=${page}&query=${query}&category=${category}&price=${price}&rating=${rating}&order=${order}&stock=${stock}`
        );
        const filteredProducts = data.products.filter(p => p.countInStock > 0 || (userInfo && (userInfo.isAdmin || userInfo.isSeller)));
        dispatch({ type: "FETCH_SUCCESS", payload: { ...data, products: filteredProducts } });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [category, order, page, price, query, rating, stock]);

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`/api/products/categories`);
        setCategories(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCategories();
  }, []);

  const getFilterUrl = (filter) => {
    const filterPage = filter.page || page;
    const filterCategory = filter.category || category;
    const filterQuery = filter.query || query;
    const filterRating = filter.rating || rating;
    const filterPrice = filter.price || price;
    const filterStock = filter.stock || stock;
    const sortOrder = filter.order || order;
    return `/search?category=${filterCategory}&query=${filterQuery}&price=${filterPrice}&rating=${filterRating}&order=${sortOrder}&page=${filterPage}&stock=${filterStock}`;
  };

  return (
    <Container className="py-4">
      <Helmet>
        <title>Search Results - Rightlamps</title>
      </Helmet>
      
      <Row className="g-3">
        <Col md={2} className="search-filter-col">
          <div className="sticky-top" style={{ top: '100px' }}>
            
            {userInfo && (userInfo.isAdmin || userInfo.isSeller) && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-transparent fw-bold py-3">Availability</Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item className="bg-transparent border-0 px-3 py-1">
                    <Link 
                      to={getFilterUrl({ stock: "all" })}
                      className={`text-decoration-none ${stock === "all" ? "fw-bold text-primary" : "text-muted"}`}
                    >
                      All Available
                    </Link>
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-transparent border-0 px-3 py-1">
                    <Link 
                      to={getFilterUrl({ stock: "out" })}
                      className={`text-decoration-none ${stock === "out" ? "fw-bold text-primary" : "text-muted"}`}
                    >
                      Out of Stock
                    </Link>
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-transparent border-0 px-3 py-1">
                    <Link 
                      to={getFilterUrl({ stock: "low" })}
                      className={`text-decoration-none ${stock === "low" ? "fw-bold text-primary" : "text-muted"}`}
                    >
                      Nearly Out of Stock
                    </Link>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            )}
          </div>
        </Col>

        <Col md={10}>
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 bg-light p-3 rounded shadow-sm">
                <div className="mb-2 mb-md-0">
                  <span className="fw-bold fs-5">{countProducts}</span> results found
                  {query !== "all" && <Badge bg="primary" className="ms-2">Query: {query}</Badge>}
                  {category !== "all" && <Badge bg="info" className="ms-2">Category: {category}</Badge>}
                  {(query !== "all" || category !== "all" || rating !== "all" || price !== "all") && (
                    <Button
                      variant="link"
                      className="text-danger p-0 ms-3 text-decoration-none small"
                      onClick={() => navigate("/search")}
                    >
                      <i className="fas fa-times me-1"></i>Clear all content
                    </Button>
                  )}
                </div>
                <div className="d-flex align-items-center">
                  <span className="me-2 text-muted text-nowrap">Sort by:</span>
                  <Form.Select
                    size="sm"
                    className="rounded-pill px-3"
                    value={order}
                    onChange={(e) => navigate(getFilterUrl({ order: e.target.value }))}
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="sold">Mostly Sold</option>
                    <option value="lowest">Price: Low to High</option>
                    <option value="highest">Price: High to Low</option>
                    <option value="toprated">Avg. Customer Review</option>
                  </Form.Select>
                </div>
              </div>

              {products.length === 0 ? (
                <MessageBox variant="info">No products matching your search criteria were found.</MessageBox>
              ) : (
                <Row className="g-3">
                  {products.map((product) => (
                    <Col sm={6} md={4} lg={3} xl={2} className="mb-3" key={product._id}>
                      <Product product={product}></Product>
                    </Col>
                  ))}
                </Row>
              )}

              {pages > 1 && (
                <div className="d-flex justify-content-center flex-wrap mt-4 pt-3 border-top">
                  {/* First Page */}
                  {page > 3 && (
                    <>
                      <Button
                        variant="outline-secondary"
                        className="mx-1 rounded-circle p-0"
                        style={{ width: '40px', height: '40px' }}
                        onClick={() => navigate(getFilterUrl({ page: 1 }))}
                      >
                        1
                      </Button>
                      <span className="mx-1 d-flex align-items-center">...</span>
                    </>
                  )}

                  {/* Neighboring Pages */}
                  {[...Array(pages).keys()]
                    .map((x) => x + 1)
                    .filter((x) => x >= page - 2 && x <= Number(page) + 2)
                    .map((x) => (
                      <Button
                        key={x}
                        variant={Number(page) === x ? "primary" : "outline-secondary"}
                        className="mx-1 rounded-circle p-0"
                        style={{ width: '40px', height: '40px' }}
                        onClick={() => navigate(getFilterUrl({ page: x }))}
                      >
                        {x}
                      </Button>
                    ))}

                  {/* Last Page */}
                  {page < pages - 2 && (
                    <>
                      <span className="mx-1 d-flex align-items-center">...</span>
                      <Button
                        variant="outline-secondary"
                        className="mx-1 rounded-circle p-0"
                        style={{ width: '40px', height: '40px' }}
                        onClick={() => navigate(getFilterUrl({ page: pages }))}
                      >
                        {pages}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
