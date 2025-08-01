document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");
  const searchFilter = document.getElementById("search-filter");

  let allActivities = {};

  // Function to categorize activities based on name and content
  function getCategory(name, details) {
    const nameLower = name.toLowerCase();
    const descLower = details.description.toLowerCase();
    
    // Life Skills activities (check first to prevent conflicts)
    if (descLower.includes('communication') || descLower.includes('decision-making') ||
        descLower.includes('creative thinking') || descLower.includes('emotional intelligence') ||
        descLower.includes('life skills')) {
      return 'Life Skills';
    }
    
    // Sports activities (exclude debate team by checking for specific sports keywords)
    if ((nameLower.includes('team') && !nameLower.includes('debate')) || 
        nameLower.includes('gym') || descLower.includes('sport') || 
        descLower.includes('physical') || nameLower.includes('soccer') || 
        nameLower.includes('basketball')) {
      return 'Sports';
    }
    
    // STEM activities  
    if (nameLower.includes('programming') || nameLower.includes('math') ||
        descLower.includes('programming') || descLower.includes('math') ||
        descLower.includes('software') || 
        (descLower.includes('competition') && nameLower.includes('math'))) {
      return 'STEM';
    }
    
    // Arts activities
    if (nameLower.includes('art') || nameLower.includes('drama') ||
        descLower.includes('creativity') || descLower.includes('painting') ||
        descLower.includes('drawing') || descLower.includes('performances')) {
      return 'Arts';
    }
    
    // Default to Clubs for everything else (including debate team)
    return 'Clubs';
  }

  // The server now provides category information for each activity.

  // Function to render activities with filters
  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    let filtered = Object.entries(allActivities);
    // Category filter
    if (categoryFilter.value) {
      filtered = filtered.filter(([name, details]) => getCategory(name, details) === categoryFilter.value);
    }
    // Search filter
    const search = searchFilter.value.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(([name, details]) =>
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search)
      );
    }
    // Sort
    if (sortFilter.value === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortFilter.value === "schedule") {
      filtered.sort((a, b) => a[1].schedule.localeCompare(b[1].schedule));
    }
    // Render
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Fetch activities and store in allActivities
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add event listeners for filters
  categoryFilter.addEventListener("change", renderActivities);
  sortFilter.addEventListener("change", renderActivities);
  searchFilter.addEventListener("input", renderActivities);

  // Initialize app
  fetchActivities();
});
