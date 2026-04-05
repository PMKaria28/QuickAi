import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
//import pdf from 'pdf-parse/lib/pdf-parse.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const _pdfParse = require("pdf-parse");
const pdf =
  typeof _pdfParse === "function"
    ? _pdfParse
    : _pdfParse && typeof _pdfParse.default === "function"
      ? _pdfParse.default
      : null;

// helper: robustly parse PDF buffers regardless of CJS/ESM shapes
async function parsePdfBuffer(buffer) {
  // Prefer the v2 `PDFParse` class (exports.PDFParse)
  if (_pdfParse && typeof _pdfParse.PDFParse === "function") {
    const parser = new _pdfParse.PDFParse({ data: buffer });
    if (typeof parser.getText === "function") return await parser.getText();
    if (typeof parser.getInfo === "function") return await parser.getInfo();
  }

  // Fallback for older pdf-parse versions which export a function
  if (typeof _pdfParse === "function") return await _pdfParse(buffer);
  if (_pdfParse && typeof _pdfParse.default === "function")
    return await _pdfParse.default(buffer);

  // Try ESM import fallback
  try {
    const mod = await import("pdf-parse");
    const fn =
      typeof mod === "function" ? mod : mod && mod.default ? mod.default : null;
    if (typeof fn === "function") return await fn(buffer);
  } catch (e) {
    // ignore
  }

  throw new TypeError(
    "pdf-parse module does not export a callable function or PDFParse class",
  );
}
//import pdf from "pdf-parse"; // Direct path to the function

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue. ",
      });
    }
    const response = await AI.chat.completions.create({
      //model: "gemini-2.0-flash",
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      //max_tokens:length,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id,prompt,content,type)
         VALUES (${userId},${prompt},${content},'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    console.log("STATUS:", error.status);
    console.log("HEADERS:", error.headers);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue. ",
      });
    }
    const response = await AI.chat.completions.create({
      //model: "gemini-2.0-flash",
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      //max_tokens:length,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id,prompt,content,type)
         VALUES (${userId},${prompt},${content},'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    console.log("STATUS:", error.status);
    console.log("HEADERS:", error.headers);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This Feature is only available for premium subscriptions ",
      });
    }
    // const response = await AI.chat.completions.create({
    //   //model: "gemini-2.0-flash",
    //   model: "gemini-2.5-flash",
    //   messages: [
    //     {
    //       role: "user",
    //       content: prompt,
    //     },
    //   ],
    //   temperature: 0.7,
    //   //max_tokens:length,
    //   max_tokens: 100,
    // });

    // const content = response.choices[0].message.content;
    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      },
    );
    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary",
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`INSERT INTO creations (user_id,prompt,content,type,publish)
         VALUES (${userId},${prompt},${secure_url},'image',${
           publish ?? false
         })`;

    // if (plan !== "premium") {
    //   await clerkClient.users.updateUserMetadata(userId, {
    //     privateMetadata: {
    //       free_usage: free_usage + 1,
    //     },
    //   });
    // }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    console.log("STATUS:", error.status);
    console.log("HEADERS:", error.headers);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This Feature is only available for premium subscriptions ",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await sql`INSERT INTO creations (user_id,prompt,content,type)
         VALUES (${userId},'Remove background from image',${secure_url},'image')`;

    // if (plan !== "premium") {
    //   await clerkClient.users.updateUserMetadata(userId, {
    //     privateMetadata: {
    //       free_usage: free_usage + 1,
    //     },
    //   });
    // }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    console.log("STATUS:", error.status);
    console.log("HEADERS:", error.headers);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (!object) {
      return res.json({
        success: false,
        message: "Please specify what to remove.",
      });
    }

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This Feature is only available for premium subscriptions ",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });
    await sql`INSERT INTO creations (user_id,prompt,content,type)
         VALUES (${userId},${`Removed ${object} from image`},${imageUrl},'image')`;

    // if (plan !== "premium") {
    //   await clerkClient.users.updateUserMetadata(userId, {
    //     privateMetadata: {
    //       free_usage: free_usage + 1,
    //     },
    //   });
    // }

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log(error.message);
    console.log("STATUS:", error.status);
    console.log("HEADERS:", error.headers);
    res.json({ success: false, message: error.message });
  }
};
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This Feature is only available for premium subscriptions",
      });
    }

    // Check if file exists
    if (!resume) {
      return res.json({
        success: false,
        message: "No resume file uploaded",
      });
    }

    // means greater than 5 mb
    if (resume.size > 5 * 1024 * 1024) {
      // Clean up file before returning
      if (fs.existsSync(resume.path)) {
        fs.unlinkSync(resume.path);
      }
      return res.json({
        success: false,
        message: "Resume File size exceeds allowed size (5mb).",
      });
    }

    // Read and parse PDF (guarded with clearer error messages)
    const dataBuffer = fs.readFileSync(resume.path);
    let pdfData;
    try {
      pdfData = await parsePdfBuffer(dataBuffer);
    } catch (parseErr) {
      console.error(
        "PDF parse error:",
        parseErr && parseErr.stack ? parseErr.stack : parseErr,
      );
      if (fs.existsSync(resume.path)) {
        try {
          fs.unlinkSync(resume.path);
        } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        message:
          "Failed to parse PDF. Ensure the file is a valid, text-based PDF.",
      });
    }

    // console.log(
    //   "Extracted PDF text length:",
    //   pdfData && pdfData.text ? pdfData.text.length : 0
    // );

    // Check if PDF has text content
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      if (fs.existsSync(resume.path)) {
        fs.unlinkSync(resume.path);
      }
      return res.json({
        success: false,
        message:
          "Could not extract text from PDF. Please ensure it's a text-based PDF.",
      });
    }

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id,prompt,content,type)
         VALUES (${userId},'Review the uploaded resume',${content},'resume-review')`;

    // Clean up file
    if (fs.existsSync(resume.path)) {
      fs.unlinkSync(resume.path);
    }

    res.json({ success: true, content });
  } catch (error) {
    // Clean up file in case of error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    console.error(
      "Resume Review Error:",
      error && error.stack ? error.stack : error,
    );
    if (error.response) {
      console.error("Upstream response error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while processing your resume",
      details: error.response
        ? { status: error.response.status, data: error.response.data }
        : undefined,
    });
  }
};
