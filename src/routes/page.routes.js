import { Router } from "express";

export const pageRouter = Router();

pageRouter.get("/", (_req, res) => {
  res.render("home", { 
        layout: "layouts/main", 
        title: "Solar System Chatbot", 
        appTitle: "Solar System Chatbot" 
  });

});
