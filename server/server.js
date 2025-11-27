const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Added this line

const activeCaptureProcesses = new Map(); // Map to store { requestId: { browser, shouldStop: boolean } }

function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

app.post('/pdf', async (req, res) => {
    const { url, followLinks = false, maxDepth = 1, requestId: clientRequestId } = req.body;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    const requestId = clientRequestId || generateRequestId(); // Use client's requestId if provided, otherwise generate
    // Initialize the process for this requestId, storing the browser instance and a shouldStop flag
    activeCaptureProcesses.set(requestId, { browser: null, shouldStop: false });

    let browser; // Declared here for the finally block
    const pdfPaths = []; // To store paths of all generated PDFs
    const visitedUrls = new Set(); // To keep track of visited URLs
    let activePages = 0; // Track active Puppeteer pages

    try {
       browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
        activeCaptureProcesses.get(requestId).browser = browser; // Store the browser instance

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        async function generatePdfRecursive(currentUrl, depth) {
            // Check for stop request at the beginning of each call
            if (activeCaptureProcesses.has(requestId) && activeCaptureProcesses.get(requestId).shouldStop) {
                console.log(`Stopping capture for ${requestId} due to stop request.`);
                return; // Abort further processing for this branch
            }

            // Normalize URL to handle variations (e.g., trailing slashes, query params) for visitedUrls set
            const normalizedUrl = new URL(currentUrl);
            normalizedUrl.hash = ''; // Ignore hash for comparison
            normalizedUrl.search = ''; // Ignore query params for comparison (optional, depending on desired behavior)
            const urlKey = normalizedUrl.toString();

            if (depth > maxDepth || visitedUrls.has(urlKey)) {
                return;
            }

            visitedUrls.add(urlKey);
            console.log(`Visiting: ${currentUrl} (Depth: ${depth})`);

            let page;
            try {
                page = await browser.newPage();
                activePages++;
                await page.setViewport({ width: 1440, height: 1920 }); // Ajustado a 1440px de ancho

                // Custom scrolling logic (from previous code) might still be useful for dynamic content rendering
                await page.goto(currentUrl, { waitUntil: 'networkidle0', timeout: 60000 }); // Increased timeout

                // Robust scrolling to ensure all dynamic content is loaded
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let lastScrollHeight = document.body.scrollHeight;
                        let scrollAttempts = 0;
                        const maxScrollAttempts = 15; // Increased attempts to allow more content to load

                        const scrollInterval = setInterval(() => {
                            window.scrollBy(0, window.innerHeight); // Scroll by viewport height
                            const newScrollHeight = document.body.scrollHeight;

                            if (newScrollHeight === lastScrollHeight) {
                                scrollAttempts++;
                            } else {
                                scrollAttempts = 0; // Reset attempts if content loaded
                            }

                            if (scrollAttempts >= maxScrollAttempts) {
                                clearInterval(scrollInterval);
                                resolve();
                            }
                            lastScrollHeight = newScrollHeight;
                        }, 250); // Increased interval to 250ms for better stability
                    });
                });
                // Add a final, longer wait after scrolling to ensure everything renders
                await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5 seconds final wait

                // Inject CSS to handle potential rendering issues (e.g., fixed headers/footers)
                await page.evaluate(() => {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = `
                        html, body {
                            overflow: visible !important;
                        }
                        header, footer, nav {
                            position: static !important;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `;
                    document.head.appendChild(style);
                });
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for CSS to apply

                // Check for stop request before generating PDF
                if (activeCaptureProcesses.has(requestId) && activeCaptureProcesses.get(requestId).shouldStop) {
                    console.log(`Stopping PDF generation for ${currentUrl} due to stop request.`);
                    return;
                }

                // Generate PDF for the current page
                const filename = `${normalizedUrl.hostname.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}-${depth}.pdf`;
                const filePath = path.join(tempDir, filename);
                await page.pdf({
                    path: filePath,
                    width: '1440px', // Ajustado a 1440px de ancho
                    height: '1920px', // Ajustado según solicitud
                    printBackground: true,
                    fullPage: true, // This will extend the height if content is longer than 1920px
                    margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' } // No margins
                });
                pdfPaths.push(filePath);
                console.log(`Generated PDF: ${filePath}`);

                if (followLinks && depth < maxDepth) {
                    const links = await page.evaluate(() => {
                        const anchors = Array.from(document.querySelectorAll('a'));
                        return anchors.map(anchor => anchor.href).filter(href => {
                            try {
                                const url = new URL(href);
                                // Filter out mailto, tel, javascript: links
                                return url.protocol.startsWith('http');
                            } catch (e) {
                                return false; // Invalid URL
                            }
                        });
                    });

                    for (const link of links) {
                        // Check for stop request again before processing each link
                        if (activeCaptureProcesses.has(requestId) && activeCaptureProcesses.get(requestId).shouldStop) {
                            console.log(`Stopping link processing for ${requestId} due to stop request.`);
                            break; // Stop iterating over links
                        }
                        try {
                            const linkUrl = new URL(link);
                            const currentHost = new URL(currentUrl).hostname;
                            // Only follow links on the same domain for now to prevent excessive crawling
                            // and ignore links that are just anchors on the same page
                            if (linkUrl.hostname === currentHost && linkUrl.pathname !== '/' && linkUrl.hash === '') {
                                await generatePdfRecursive(link, depth + 1);
                            }
                        } catch (e) {
                            console.warn(`Invalid link found: ${link}`);
                        }
                    }
                }
            } catch (pageError) {
                console.error(`Error processing URL ${currentUrl}:`, pageError);
            } finally {
                if (page) {
                    await page.close();
                    activePages--;
                }
            }
        }

        await generatePdfRecursive(url, 0);

        // Send the requestId back to the client
        res.status(200).json({
            message: 'PDFs generated successfully',
            pdfFiles: pdfPaths.map(p => path.basename(p)),
            requestId: requestId // Send requestId back
        });

    } catch (error) {
        console.error('Error in PDF generation process:', error);
        res.status(500).json({ message: 'Error generating PDF', details: error.message }); // Envía JSON
    } finally {
        // Ensure all pages are closed before closing the browser
        while (activePages > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for pages to close
        }
        if (browser) {
            await browser.close();
        }
        // Clean up the activeCaptureProcesses entry
        activeCaptureProcesses.delete(requestId);
        // In a real application, you might want to clean up temp files after some time or after the client downloads them.
    }
});

// New endpoint to serve generated PDF files for download
app.get('/download-pdf/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'temp', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file.');
            }
        });
    } else {
        res.status(404).send('File not found.');
    }
});

app.post('/stop-capture', (req, res) => {
    const { requestId } = req.body;
    if (activeCaptureProcesses.has(requestId)) {
        activeCaptureProcesses.get(requestId).shouldStop = true;
        res.status(200).json({ message: `Capture process ${requestId} marked for stopping.` });
    } else {
        res.status(404).json({ message: `Capture process ${requestId} not found.` });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
