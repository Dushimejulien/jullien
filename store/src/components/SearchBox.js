import React, { useState } from "react";
import { Form, InputGroup, FormControl, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submitHandler = (e) => {
    e.preventDefault();
    navigate(query ? `/search?query=${query}` : "/search");
  };

  return (
    <Form className="w-100" style={{ maxWidth: '500px' }} onSubmit={submitHandler}>
      <InputGroup className="shadow-sm rounded-pill overflow-hidden border">
        <FormControl
          type="text"
          name="query"
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          aria-label="Search Products"
          className="border-0 bg-transparent py-2 ps-4"
        />
        <Button 
          variant="primary" 
          type="submit" 
          id="button-search"
          className="px-4 border-0"
        >
          <i className="fas fa-search text-white"></i>
        </Button>
      </InputGroup>
    </Form>
  );
}
