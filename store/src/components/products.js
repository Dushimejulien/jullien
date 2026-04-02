import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button, Badge } from "react-bootstrap";
import Rating from "./Rating";
import axios from "axios";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";

function Product(props) {
  const { product } = props;
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart: { cartItems }, userInfo } = state;
  const navigate = useNavigate();

  const addToCartHandler = async (item) => {
    const existItem = cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert("Sorry. Product is out of stock");
      return;
    }
    ctxDispatch({ type: "CART_ADD_ITEM", payload: { ...item, quantity } });
    toast.success("Added to cart");
  };

  return (
    <Card className="h-100 shadow-sm border-0 product-card">
      <Link to={`/product/${product.slug}`}>
        <img
          src={product.image}
          className="card-img-top product-card-img"
          alt={product.name}
          onError={(e) => { e.target.onerror = null; e.target.src = "/logo.png"; }}
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <Link to={`/product/${product.slug}`} className="text-decoration-none text-dark">
          <Card.Title
            className="fs-6 fw-normal mb-1"
            style={{ height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {product.name}
          </Card.Title>
        </Link>
        <div className="mb-2">
          <Rating rating={product.rating} numReviews={product.numReviews} />
        </div>
        <Card.Text className="h5 fw-bold mb-1 text-primary">
          {product.price ? product.price.toLocaleString() : "0"} RWF
        </Card.Text>
        <div className="small text-muted mb-3">
          {product.sold > 0
            ? `${product.sold >= 1000 ? (product.sold / 1000).toFixed(1) + 'k' : product.sold}+ sold`
            : "New Arrival"}
        </div>

        <div className="mt-auto d-grid gap-2">
          {userInfo && (userInfo.isSeller || userInfo.isAdmin) ? (
            <Button
              onClick={() => navigate(`/admin/product/${product._id}`)}
              variant="outline-primary"
              className="rounded-pill"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Product
            </Button>
          ) : product.countInStock === 0 ? (
            <Button variant="light" disabled className="rounded-pill">Out of stock</Button>
          ) : (
            <Button
              onClick={() => addToCartHandler(product)}
              variant="primary"
              className="rounded-pill"
            >
              <i className="fas fa-shopping-cart me-2"></i>
              Add to Cart
            </Button>
          )}

          {userInfo && (userInfo.isAdmin || userInfo.isSeller) && (
            <div className="d-flex gap-2 mt-1">
              <Badge
                bg={product.countInStock === 0 ? "danger" : product.countInStock < 10 ? "warning" : "success"}
                className="d-flex align-items-center px-3 py-2 flex-grow-1 justify-content-center"
                style={{ fontSize: '0.8rem' }}
              >
                {product.countInStock === 0
                  ? "🚨 Out of Stock"
                  : product.countInStock < 10
                  ? `⚠ Low: ${product.countInStock} left`
                  : `✓ Stock: ${product.countInStock}`}
              </Badge>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default Product;
