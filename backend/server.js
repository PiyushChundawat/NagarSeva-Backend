import express from "express";
import { createClient } from '@supabase/supabase-js';
import cors from "cors";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// IMPORTANT: Use environment variables for sensitive data
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: 'Welcome to API with SLA Tracking',
    timestamp: new Date().toISOString()
  });
});

// Helper function to calculate deadline
async function calculateDeadline(department, createdAt) {
  try {
    // Get SLA hours from Department table
    const { data: deptData, error } = await supabase
      .from('Department')
      .select('SLAHours')
      .eq('DeptName', department)
      .single();

    if (error || !deptData) {
      console.warn(`⚠️ Department ${department} not found, using default 48 hours`);
      const slaHours = 48; // Default
      const deadline = new Date(new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000);
      return deadline.toISOString();
    }

    const slaHours = deptData.SLAHours || 48;
    const deadline = new Date(new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000);
    
    console.log(`📅 Calculated deadline: ${deadline.toISOString()} (${slaHours} hours from ${createdAt})`);
    
    return deadline.toISOString();
  } catch (err) {
    console.error("Error calculating deadline:", err);
    // Fallback to 48 hours
    const deadline = new Date(new Date(createdAt).getTime() + 48 * 60 * 60 * 1000);
    return deadline.toISOString();
  }
}

// Submit a new complaint with SLA tracking
app.post("/complaint", async (req, res) => {
  try {
    const {
      Name,
      Phone,
      Address,
      Description,
      Department,
      Latitude,
      Longitude,
      photoData,
      userId
    } = req.body;

    console.log("📝 Received complaint submission");
    console.log("Department:", Department);
    console.log("Has photo:", !!photoData);

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User authentication required. Please login to submit a complaint."
      });
    }

    // Validate Department
    if (!Department) {
      return res.status(400).json({
        success: false,
        message: "Department is required."
      });
    }

    let photoUrl = null;
   
    // Handle photo upload
    if (photoData) {
      try {
        console.log("📸 Processing image upload...");
        
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `complaint_${timestamp}_${randomStr}.jpg`;
        const filePath = `complaints/${fileName}`;
       
        let base64Data = photoData;
        let contentType = 'image/jpeg';
        
        if (photoData.startsWith('data:image')) {
          const mimeMatch = photoData.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          if (mimeMatch && mimeMatch[1]) {
            contentType = mimeMatch[1];
          }
          base64Data = photoData.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        }
        
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
        console.log("📊 Upload details:", {
          fileName,
          size: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
          contentType
        });
       
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('complaint-images')
          .upload(filePath, fileBuffer, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: false
          });
       
        if (uploadError) {
          console.error("❌ Upload error:", uploadError);
          throw uploadError;
        }
       
        console.log("✅ Upload successful");
       
        const { data: urlData } = supabase
          .storage
          .from('complaint-images')
          .getPublicUrl(filePath);
       
        photoUrl = urlData.publicUrl;
        console.log("🔗 Photo URL:", photoUrl);
        
      } catch (photoError) {
        console.error("❌ Photo error:", photoError.message);
        photoUrl = null;
      }
    }

    // Calculate deadline for SLA tracking
    const createdAt = new Date().toISOString();
    const deadline = await calculateDeadline(Department, createdAt);

    // Assignment logic
    let assignedEid = null;
    let workStatus = 'Pending';
    let assignmentMessage = "Complaint submitted successfully";

    console.log("🔍 Finding employees in department:", Department);
    
    const { data: employees, error: employeeError } = await supabase
      .from('EmployeeProfile')
      .select('Eid, AssignCid, AssignHistory, DeptId, Name')
      .eq('DeptId', Department);

    console.log("Query result:", { 
      employees: employees?.length || 0, 
      error: employeeError?.message || 'none' 
    });

    if (employeeError) {
      console.error("❌ Employee query error:", employeeError);
    }

    if (!employeeError && employees && employees.length > 0) {
      console.log("👥 Found", employees.length, "employees");
      
      let selectedEmployee = null;
      let minTasks = 5;

      for (const employee of employees) {
        let currentTasks = 0;
        
        if (employee.AssignCid) {
          if (Array.isArray(employee.AssignCid)) {
            currentTasks = employee.AssignCid.length;
          } else if (typeof employee.AssignCid === 'string') {
            currentTasks = employee.AssignCid.split(',').filter(id => id.trim()).length;
          }
        }

        console.log(`Employee ${employee.Eid}: ${currentTasks} tasks`);

        if (currentTasks < minTasks) {
          minTasks = currentTasks;
          selectedEmployee = employee;
        }
      }

      if (selectedEmployee) {
        assignedEid = selectedEmployee.Eid;
        workStatus = 'In Progress';
        assignmentMessage = "Complaint submitted and assigned successfully";
        console.log("✅ Selected employee:", assignedEid, "with", minTasks, "tasks");
      } else {
        console.log("⚠️ No employee selected - all have 5+ tasks");
      }
    } else {
      console.log("⚠️ No employees found for department:", Department);
    }

    // Insert complaint with SLA fields
    console.log("💾 Saving complaint with SLA tracking...");
    const { data: complaintData, error: complaintError } = await supabase
      .from('complaints')
      .insert([
        {
          Name,
          Phone,
          Address,
          Department,
          Description,
          PhotoUrl: photoUrl,
          Latitude,
          Longitude,
          userId,
          Eid: assignedEid,
          WorkStatus: workStatus,
          CreatedAt: createdAt,
          deadline: deadline,
          slastatus: 'On Track'
        }
      ])
      .select()
      .single();
   
    if (complaintError) {
      console.error("❌ Database error:", complaintError);
      return res.status(500).json({
        success: false,
        message: "Error submitting complaint",
        error: complaintError.message
      });
    }

    console.log("✅ Complaint saved with Cid:", complaintData.Cid);
    console.log("📅 Deadline set to:", deadline);

    // Update employee assignment
    if (assignedEid && complaintData && complaintData.Cid) {
      console.log("🔄 Updating employee assignment...");
      
      const selectedEmployee = employees.find(emp => emp.Eid === assignedEid);
      
      if (selectedEmployee) {
        let updatedAssignCid;
        if (!selectedEmployee.AssignCid) {
          updatedAssignCid = [complaintData.Cid];
        } else if (Array.isArray(selectedEmployee.AssignCid)) {
          updatedAssignCid = [...selectedEmployee.AssignCid, complaintData.Cid];
        } else if (typeof selectedEmployee.AssignCid === 'string') {
          const existingIds = selectedEmployee.AssignCid
            .split(',')
            .filter(id => id.trim())
            .map(id => parseInt(id));
          updatedAssignCid = [...existingIds, complaintData.Cid];
        } else {
          updatedAssignCid = [complaintData.Cid];
        }

        const historyEntry = {
          Cid: complaintData.Cid,
          assignedAt: new Date().toISOString(),
          status: 'Assigned'
        };

        let updatedHistory;
        if (!selectedEmployee.AssignHistory) {
          updatedHistory = [historyEntry];
        } else if (Array.isArray(selectedEmployee.AssignHistory)) {
          updatedHistory = [...selectedEmployee.AssignHistory, historyEntry];
        } else if (typeof selectedEmployee.AssignHistory === 'string') {
          try {
            const existingHistory = JSON.parse(selectedEmployee.AssignHistory);
            updatedHistory = Array.isArray(existingHistory) 
              ? [...existingHistory, historyEntry]
              : [historyEntry];
          } catch {
            updatedHistory = [historyEntry];
          }
        } else {
          updatedHistory = [historyEntry];
        }

        const { data: updateData, error: updateError } = await supabase
          .from('EmployeeProfile')
          .update({ 
            AssignCid: updatedAssignCid,
            AssignHistory: updatedHistory
          })
          .eq('Eid', assignedEid)
          .select();

        if (updateError) {
          console.error("❌ Employee update error:", updateError);
        } else {
          console.log("✅ Employee updated:", updateData);
        }
      }
    }
   
    console.log("🎉 Success!");
    
    res.status(200).json({
      success: true,
      message: assignmentMessage,
      data: {
        Cid: complaintData.Cid,
        photoUrl: photoUrl,
        assignedTo: assignedEid,
        status: workStatus,
        deadline: deadline,
        slaStatus: 'On Track'
      }
    });  
  } catch(err) {
    console.error("❌ ERROR:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Error submitting complaint",
      error: err.message
    });
  }
});

// Get all complaints for a specific user
app.get("/complaints/user/:userId", async(req, res) => {
  try {
    console.log("=== USER COMPLAINTS ENDPOINT HIT ===");
    const userId = req.params.userId;
   
    console.log("🔍 Fetching complaints for user:", userId);

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { data, error } = await supabase 
      .from('complaints')
      .select('*')
      .eq('userId', userId)
      .order('CreatedAt', { ascending: false });

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    console.log(`✅ Found ${data.length} complaints for user ${userId}`);

    res.status(200).json({
      success: true,
      message: `Found ${data.length} complaints.`,
      data: data
    });
  } catch(err) {
    console.error("❌ Server error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get a specific complaint by ID with SLA info
app.get("/complaint/:id", async(req, res) => {
  try {
    console.log("=== COMPLAINT ENDPOINT HIT ===");
   
    let cidString = req.params.id || '';
    if (cidString.startsWith(':')) {
      cidString = cidString.substring(1);
    }
   
    const Cid = parseInt(cidString, 10);
   
    if (isNaN(Cid) || Cid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID. Must be a positive number.'
      });
    }
   
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        WorkStatus,
        CreatedAt,
        Address,
        Eid,
        deadline,
       slastatus,
        slaviolatedat,
        EmployeeProfile:Eid (
          Name,
          DeptId
        )
      `)
      .eq('Cid', Cid)
      .single();
   
    if (error) {
      console.error("Database error:", error);
      const notFoundCodes = new Set(['PGRST116', 'PGRST106']);
      if (notFoundCodes.has(error.code)) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.'
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    const responseData = {
      WorkStatus: data.WorkStatus,
      CreatedAt: data.CreatedAt,
      Address: data.Address,
      Eid: data.Eid,
      Deadline: data.deadline,
      SLAStatus: data.slastatus,
      SLAViolatedAt: data.slaviolatedat,
      EmployeeName: data.EmployeeProfile?.Name || null,
      Department: data.EmployeeProfile?.DeptId || null
    };

    res.status(200).json({
      success: true,
      message: 'Complaint found successfully',
      data: responseData
    });
  } catch(err) {
    console.error("Catch block error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get coordinates for pending complaints (for heatmap)
app.get("/leaflet", async(req, res) => {
  try {
    console.log("=== LEAFLET ENDPOINT HIT ===");

    const { data, error } = await supabase
      .from('complaints')
      .select('Latitude, Longitude, Cid')
      .eq('WorkStatus', 'Pending')
      .not('Latitude', 'is', null)
      .not('Longitude', 'is', null);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    const validCoordinates = data.filter(item => 
      typeof item.Latitude === 'number' && 
      typeof item.Longitude === 'number' &&
      item.Latitude >= -90 && item.Latitude <= 90 &&
      item.Longitude >= -180 && item.Longitude <= 180
    );

    const heatmapData = validCoordinates.map(item => [
      item.Latitude,
      item.Longitude
    ]);

    res.status(200).json({
      success: true,
      message: `Found ${validCoordinates.length} pending complaints with coordinates`,
      count: validCoordinates.length,
      data: heatmapData,
      details: validCoordinates
    });
  } catch(err) {
    console.error("Catch block error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Toggle complaint status with SLA update
app.patch("/complaint/:Cid/toggle", async(req, res) => {
  try {
    console.log("=== PATCH ENDPOINT HIT ===");
   
    let cidString = req.params.Cid || '';
    if (cidString.startsWith(':')) {
      cidString = cidString.substring(1);
    }
   
    const Cid = parseInt(cidString, 10);
   
    if (isNaN(Cid) || Cid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID. Must be a positive number.'
      });
    }
   
    const { data: currentComplaint, error: fetchError } = await supabase
      .from('complaints')
      .select('WorkStatus, Eid, Department, CreatedAt, Deadline')
      .eq('Cid', Cid)
      .single();
   
    if (fetchError || !currentComplaint) {
      console.error("Complaint not found:", fetchError);
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
   
    const newStatus = currentComplaint.WorkStatus === 'In Progress' ? 'Complete' : 'In Progress';
    
    // Calculate time to resolve if marking as complete
    let timeToResolve = null;
    if (newStatus === 'Complete') {
      const completedAt = new Date();
      const createdAt = new Date(currentComplaint.CreatedAt);
      const diffMs = completedAt - createdAt;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      timeToResolve = `${diffHours} hours ${diffMins} minutes`;
    }
   
    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update({
        WorkStatus: newStatus,
        SLAStatus: newStatus === 'Complete' ? 'Completed' : currentComplaint.SLAStatus,
        TimeToResolve: timeToResolve
      })
      .eq('Cid', Cid)
      .select()
      .single();
   
    if (updateError) {
      console.error("Database update error:", updateError);
      return res.status(500).json({
        success: false,
        message: 'Complaint Update Error.',
        error: updateError.message
      });
    }

    // Auto-assignment logic when complaint is marked Complete
    let autoAssignmentInfo = null;
    
    if (newStatus === 'Complete' && currentComplaint.Eid) {
      console.log("🔄 Employee completed a task, checking for pending complaints...");
      
      const employeeId = currentComplaint.Eid;
      const department = currentComplaint.Department;

      const { data: employeeData, error: empFetchError } = await supabase
        .from('EmployeeProfile')
        .select('AssignCid, AssignHistory, Eid, Name')
        .eq('Eid', employeeId)
        .single();

      if (!empFetchError && employeeData) {
        let updatedAssignCid = [];
        if (employeeData.AssignCid) {
          if (Array.isArray(employeeData.AssignCid)) {
            updatedAssignCid = employeeData.AssignCid.filter(id => id !== Cid);
          } else if (typeof employeeData.AssignCid === 'string') {
            updatedAssignCid = employeeData.AssignCid
              .split(',')
              .filter(id => id.trim())
              .map(id => parseInt(id))
              .filter(id => id !== Cid);
          }
        }

        console.log(`📊 Employee ${employeeId} now has ${updatedAssignCid.length} active tasks`);

        await supabase
          .from('EmployeeProfile')
          .update({ AssignCid: updatedAssignCid })
          .eq('Eid', employeeId);

        if (updatedAssignCid.length < 5) {
          console.log("✅ Employee has capacity, checking for pending complaints...");

          const { data: pendingComplaints, error: pendingError } = await supabase
            .from('complaints')
            .select('Cid, Name, Department, Address, CreatedAt, Deadline')
            .eq('Department', department)
            .eq('WorkStatus', 'Pending')
            .is('Eid', null)
            .order('CreatedAt', { ascending: true })
            .limit(1);

          if (!pendingError && pendingComplaints && pendingComplaints.length > 0) {
            const pendingComplaint = pendingComplaints[0];
            console.log(`🎯 Found pending complaint ${pendingComplaint.Cid}, assigning to employee ${employeeId}`);

            const { error: assignError } = await supabase
              .from('complaints')
              .update({
                Eid: employeeId,
                WorkStatus: 'In Progress'
              })
              .eq('Cid', pendingComplaint.Cid);

            if (!assignError) {
              const newAssignCid = [...updatedAssignCid, pendingComplaint.Cid];
              
              const historyEntry = {
                Cid: pendingComplaint.Cid,
                assignedAt: new Date().toISOString(),
                status: 'Auto-Assigned'
              };

              let updatedHistory = [];
              if (!employeeData.AssignHistory) {
                updatedHistory = [historyEntry];
              } else if (Array.isArray(employeeData.AssignHistory)) {
                updatedHistory = [...employeeData.AssignHistory, historyEntry];
              } else if (typeof employeeData.AssignHistory === 'string') {
                try {
                  const existingHistory = JSON.parse(employeeData.AssignHistory);
                  updatedHistory = Array.isArray(existingHistory) 
                    ? [...existingHistory, historyEntry]
                    : [historyEntry];
                } catch {
                  updatedHistory = [historyEntry];
                }
              } else {
                updatedHistory = [historyEntry];
              }

              const { error: updateEmpError } = await supabase
                .from('EmployeeProfile')
                .update({
                  AssignCid: newAssignCid,
                  AssignHistory: updatedHistory
                })
                .eq('Eid', employeeId);

              if (!updateEmpError) {
                console.log("✅ Pending complaint auto-assigned successfully");
                autoAssignmentInfo = {
                  newComplaintId: pendingComplaint.Cid,
                  message: `Pending complaint #${pendingComplaint.Cid} automatically assigned`
                };
              }
            }
          }
        }
      }
    }
   
    res.status(200).json({
      success: true,
      message: `Status changed from ${currentComplaint.WorkStatus} to ${newStatus}`,
      data: updatedComplaint,
      autoAssignment: autoAssignmentInfo
    });
  } catch(err) {
    console.error("Patch error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// NEW: Get SLA violations for manager dashboard
app.get("/manager/:Eid/sla-violations", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("=== MANAGER SLA VIOLATIONS ENDPOINT ===");
    
    // Get manager's department
    const { data: manager } = await supabase
      .from('EmployeeProfile')
      .select('DeptId')
      .eq('Eid', Eid)
      .single();
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    // Get department name
    const { data: deptData } = await supabase
      .from('Department')
      .select('DeptName')
      .eq('DeptId', manager.DeptId)
      .single();
    
    const departmentName = deptData?.DeptName;
    
    // Get SLA violated complaints (Pending only)
    const { data: pendingViolations } = await supabase
      .from('complaints')
      .select(`
        *,
        EmployeeProfile:Eid (
          Name,
          Eid
        )
      `)
      .eq('Department', departmentName)
      .eq('WorkStatus', 'Pending')
      .eq('SLAStatus', 'Violated')
      .order('SLAViolatedAt', { ascending: true });
    
    // Get SLA violated complaints (In Progress)
    const { data: inProgressViolations } = await supabase
      .from('complaints')
      .select(`
        *,
        EmployeeProfile:Eid (
          Name,
          Eid
        )
      `)
      .eq('Department', departmentName)
      .eq('WorkStatus', 'In Progress')
      .eq('SLAStatus', 'Violated')
      .order('SLAViolatedAt', { ascending: true });
    
    // Get warnings (close to deadline)
    const { data: warnings } = await supabase
      .from('complaints')
      .select(`
        *,
        EmployeeProfile:Eid (
          Name,
          Eid
        )
      `)
      .eq('Department', departmentName)
      .in('WorkStatus', ['Pending', 'In Progress'])
      .eq('SLAStatus', 'Warning')
      .order('Deadline', { ascending: true });
    
    res.status(200).json({
      success: true,
      data: {
        pendingViolations: pendingViolations || [],
        inProgressViolations: inProgressViolations || [],
        warnings: warnings || []
      },
      counts: {
        pendingViolations: pendingViolations?.length || 0,
        inProgressViolations: inProgressViolations?.length || 0,
        warnings: warnings?.length || 0,
        total: (pendingViolations?.length || 0) + (inProgressViolations?.length || 0) + (warnings?.length || 0)
      }
    });
  } catch(err) {
    console.error("SLA violations error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// NEW: Get SLA violations for employee dashboard
app.get("/employee/:Eid/sla-violations", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("=== EMPLOYEE SLA VIOLATIONS ENDPOINT ===");
    
    // Get SLA violated complaints assigned to this employee
    const { data: violations } = await supabase
      .from('complaints')
      .select('*')
      .eq('Eid', Eid)
      .eq('WorkStatus', 'In Progress')
      .eq('SLAStatus', 'Violated')
      .order('SLAViolatedAt', { ascending: true });
    
    // Get warnings
    const { data: warnings } = await supabase
      .from('complaints')
      .select('*')
      .eq('Eid', Eid)
      .eq('WorkStatus', 'In Progress')
      .eq('SLAStatus', 'Warning')
      .order('Deadline', { ascending: true });
    
    res.status(200).json({
      success: true,
      data: {
        violations: violations || [],
        warnings: warnings || []
      },
      counts: {
        violations: violations?.length || 0,
        warnings: warnings?.length || 0,
        total: (violations?.length || 0) + (warnings?.length || 0)
      }
    });
  } catch(err) {
    console.error("Employee SLA violations error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// NEW: Get SLA notifications
app.get("/notifications/:Eid", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    const { unreadOnly } = req.query;
    
    console.log("=== NOTIFICATIONS ENDPOINT ===");
    
    let query = supabase
      .from('sla_notifications')
      .select(`
        *,
        complaints:Cid (
          Cid,
          Name,
          Address,
          Department,
          WorkStatus
        )
      `)
      .eq('Eid', Eid)
      .order('createdAt', { ascending: false });
    
    if (unreadOnly === 'true') {
      query = query.eq('isRead', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: notifications || [],
      count: notifications?.length || 0
    });
  } catch(err) {
    console.error("Notifications error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// NEW: Mark notification as read
app.patch("/notifications/:id/read", async(req, res) => {
  try {
    const notificationId = req.params.id;
    
    const { error } = await supabase
      .from('sla_notifications')
      .update({ 
        isRead: true,
        readAt: new Date().toISOString()
      })
      .eq('id', notificationId);
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch(err) {
    console.error("Mark notification error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// NEW: Trigger manual SLA check
app.post("/trigger-sla-check", async(req, res) => {
  try {
    console.log("🔄 Manual SLA check triggered");
    
    // You can call your edge function here or implement the logic
    // For now, we'll just acknowledge the request
    
    res.status(200).json({
      success: true,
      message: 'SLA check triggered. Results will be available shortly.'
    });
  } catch(err) {
    console.error("SLA check trigger error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get manager profile and department info
app.get("/manager/:Eid/profile", async(req, res) => {
  try {
    const Eid = req.params.Eid;
   
    console.log("=== MANAGER PROFILE ENDPOINT HIT ===");
    console.log("Manager Eid:", Eid);
   
    // First, get the manager profile
    const { data: managerProfile, error: profileError } = await supabase
      .from('EmployeeProfile')
      .select('*')
      .eq('Eid', Eid)
      .eq('role', 'manager')
      .single();
   
    if (profileError || !managerProfile) {
      console.error("Manager not found:", profileError);
      return res.status(404).json({
        success: false,
        message: 'Manager not found or invalid role'
      });
    }

    // Then, get the department name
    let departmentName = null;
    if (managerProfile.DeptId) {
      const { data: deptData } = await supabase
        .from('Department')
        .select('DeptName')
        .eq('DeptId', managerProfile.DeptId)
        .single();
      
      departmentName = deptData?.DeptName;
      console.log("Department:", departmentName);
    }
   
    // Return enhanced profile
    const responseData = {
      ...managerProfile,
      DepartmentName: departmentName,
      DepartmentCode: managerProfile.DeptId
    };
   
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch(err) {
    console.error("Manager profile error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get all workers in manager's department
app.get("/manager/:Eid/workers", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("=== MANAGER WORKERS ENDPOINT HIT ===");
    
    const { data: manager, error: managerError } = await supabase
      .from('EmployeeProfile')
      .select('DeptId')
      .eq('Eid', Eid)
      .single();
    
    if (managerError || !manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    const { data: workers, error: workersError } = await supabase
      .from('EmployeeProfile')
      .select('*')
      .eq('DeptId', manager.DeptId)
      .eq('role', 'employee')
      .order('Name', { ascending: true });
    
    if (workersError) {
      console.error("Workers fetch error:", workersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch workers'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workers || [],
      count: workers?.length || 0
    });
  } catch(err) {
    console.error("Workers fetch error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get all complaints for manager's department
app.get("/manager/:Eid/complaints", async(req, res) => {
  try {
    const Eid = req.params.Eid;
   
    console.log("=== MANAGER COMPLAINTS ENDPOINT HIT ===");
    console.log("Manager Eid:", Eid);
   
    // Get manager's department
    const { data: manager, error: managerError } = await supabase
      .from('EmployeeProfile')
      .select('DeptId')
      .eq('Eid', Eid)
      .single();
   
    if (managerError || !manager) {
      console.error("Manager not found:", managerError);
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
   
    console.log("Manager's DeptId:", manager.DeptId);
   
    // Fetch complaints directly using DeptId (not DeptName)
    const { data: complaints, error: complaintsError } = await supabase
      .from('complaints')
      .select(`
        *,
        EmployeeProfile:Eid (
          Name,
          Eid
        )
      `)
      .eq('Department', manager.DeptId)  // ✅ Match with DeptId directly
      .order('CreatedAt', { ascending: false });
   
    if (complaintsError) {
      console.error("Complaints fetch error:", complaintsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch complaints'
      });
    }
   
    console.log("Complaints found:", complaints?.length || 0);
   
    res.status(200).json({
      success: true,
      data: complaints || [],
      count: complaints?.length || 0
    });
  } catch(err) {
    console.error("Complaints fetch error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get statistics for manager's department with SLA metrics
app.get("/manager/:Eid/stats", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("=== MANAGER STATS ENDPOINT HIT ===");
    
    const { data: manager } = await supabase
      .from('EmployeeProfile')
      .select('DeptId')
      .eq('Eid', Eid)
      .single();
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    const { data: deptData } = await supabase
      .from('Department')
      .select('DeptName')
      .eq('DeptId', manager.DeptId)
      .single();
    
    const departmentName = deptData?.DeptName;
    
    const { count: workersCount } = await supabase
      .from('EmployeeProfile')
      .select('*', { count: 'exact', head: true })
      .eq('DeptId', manager.DeptId)
      .eq('role', 'employee');
    
    const { count: totalComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName);
    
    const { count: pendingComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('WorkStatus', 'Pending');
    
    const { count: inProgressComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('WorkStatus', 'In Progress');
    
    const { count: completedComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('WorkStatus', 'Complete');
    
    // SLA Statistics
    const { count: slaViolations } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('SLAStatus', 'Violated')
      .in('WorkStatus', ['Pending', 'In Progress']);
    
    const { count: slaWarnings } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('SLAStatus', 'Warning')
      .in('WorkStatus', ['Pending', 'In Progress']);
    
    const { count: onTrack } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', departmentName)
      .eq('SLAStatus', 'On Track')
      .in('WorkStatus', ['Pending', 'In Progress']);
    
    const stats = {
      totalWorkers: workersCount || 0,
      totalComplaints: totalComplaints || 0,
      pendingComplaints: pendingComplaints || 0,
      inProgressComplaints: inProgressComplaints || 0,
      completedComplaints: completedComplaints || 0,
      sla: {
        violations: slaViolations || 0,
        warnings: slaWarnings || 0,
        onTrack: onTrack || 0,
        complianceRate: totalComplaints > 0 
          ? ((completedComplaints - (slaViolations || 0)) / totalComplaints * 100).toFixed(1)
          : '0.0'
      }
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch(err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Assign complaint to worker
// app.post("/manager/assign-complaint", async(req, res) => {
//   try {
//     const { complaintId, workerId, managerId } = req.body;
    
//     console.log("=== ASSIGN COMPLAINT ENDPOINT HIT ===");
    
//     if (!complaintId || !workerId || !managerId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields'
//       });
//     }
    
//     const { data: updatedComplaint, error: updateError } = await supabase
//       .from('complaints')
//       .update({
//         Eid: workerId,
//         WorkStatus: 'In Progress'
//       })
//       .eq('Cid', complaintId)
//       .select()
//       .single();
    
//     if (updateError) {
//       console.error("Assignment error:", updateError);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to assign complaint'
//       });
//     }
    
//     const { data: employee } = await supabase
//       .from('EmployeeProfile')
//       .select('AssignCid, AssignHistory')
//       .eq('Eid', workerId)
//       .single();
    
//     if (employee) {
//       let updatedAssignCid;
//       if (!employee.AssignCid) {
//         updatedAssignCid = [complaintId];
//       } else if (Array.isArray(employee.AssignCid)) {
//         updatedAssignCid = [...employee.AssignCid, complaintId];
//       } else {
//         updatedAssignCid = [complaintId];
//       }
      
//       const historyEntry = {
//         Cid: complaintId,
//         assignedAt: new Date().toISOString(),
//         assignedBy: managerId,
//         status: 'Assigned'
//       };
      
//       let updatedHistory;
//       if (!employee.AssignHistory) {
//         updatedHistory = [historyEntry];
//       } else if (Array.isArray(employee.AssignHistory)) {
//         updatedHistory = [...employee.AssignHistory, historyEntry];
//       } else {
//         updatedHistory = [historyEntry];
//       }
      
//       await supabase
//         .from('EmployeeProfile')
//         .update({
//           AssignCid: updatedAssignCid,
//           AssignHistory: updatedHistory
//         })
//         .eq('Eid', workerId);
//     }
    
//     res.status(200).json({
//       success: true,
//       message: 'Complaint assigned successfully',
//       data: updatedComplaint
//     });
//   } catch(err) {
//     console.error("Assign complaint error:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// Delete complaint (manager only)
app.delete("/manager/complaint/:Cid", async(req, res) => {
  try {
    const Cid = parseInt(req.params.Cid, 10);
    const { managerId } = req.query;
    
    console.log("=== MANAGER DELETE COMPLAINT ===");
    
    if (isNaN(Cid) || Cid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID'
      });
    }
    
    const { data: manager } = await supabase
      .from('EmployeeProfile')
      .select('DeptId, role')
      .eq('Eid', managerId)
      .single();
    
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only managers can delete complaints'
      });
    }
    
    const { data: deptData } = await supabase
      .from('Department')
      .select('DeptName')
      .eq('DeptId', manager.DeptId)
      .single();
    
    const { data: complaint } = await supabase
      .from('complaints')
      .select('Department, Eid, WorkStatus')
      .eq('Cid', Cid)
      .single();
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    if (complaint.Department !== deptData?.DeptName) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete complaints from your department'
      });
    }

    if (complaint.WorkStatus !== 'In Progress' && complaint.WorkStatus !== 'Pending') {
      return res.status(403).json({
        success: false,
        message: 'Only complaints with status "In Progress" or "Pending" can be deleted'
      });
    }
    
    if (complaint.Eid) {
      const { data: employee } = await supabase
        .from('EmployeeProfile')
        .select('AssignCid, AssignHistory')
        .eq('Eid', complaint.Eid)
        .single();
      
      if (employee) {
        let updatedAssignCid = [];
        if (Array.isArray(employee.AssignCid)) {
          updatedAssignCid = employee.AssignCid.filter(id => id !== Cid);
        } else if (employee.AssignCid) {
          updatedAssignCid = employee.AssignCid === Cid ? [] : [employee.AssignCid];
        }

        let updatedAssignHistory = [];
        if (Array.isArray(employee.AssignHistory)) {
          updatedAssignHistory = employee.AssignHistory.filter(id => id !== Cid.toString());
        } else if (employee.AssignHistory) {
          updatedAssignHistory = employee.AssignHistory === Cid.toString() ? [] : [employee.AssignHistory];
        }
        
        await supabase
          .from('EmployeeProfile')
          .update({ 
            AssignCid: updatedAssignCid,
            AssignHistory: updatedAssignHistory 
          })
          .eq('Eid', complaint.Eid);
      }
    }
    
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .eq('Cid', Cid);
    
    if (deleteError) {
      console.error("Delete error:", deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete complaint'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch(err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get heatmap data for manager's department
app.get("/manager/:Eid/heatmap", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("=== MANAGER HEATMAP ENDPOINT ===");
    
    const { data: manager } = await supabase
      .from('EmployeeProfile')
      .select('DeptId')
      .eq('Eid', Eid)
      .single();
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    const { data: deptData } = await supabase
      .from('Department')
      .select('DeptName')
      .eq('DeptId', manager.DeptId)
      .single();
    
    const { data: complaints } = await supabase
      .from('complaints')
      .select('Latitude, Longitude, Cid, WorkStatus')
      .eq('Department', deptData?.DeptName)
      .not('Latitude', 'is', null)
      .not('Longitude', 'is', null);
    
    const heatmapData = complaints?.map(c => [
      c.Latitude,
      c.Longitude,
      c.WorkStatus === 'Pending' ? 1 : 0.5
    ]) || [];
    
    res.status(200).json({
      success: true,
      data: heatmapData,
      count: heatmapData.length
    });
  } catch(err) {
    console.error("Heatmap error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get analytics data
// Get analytics data
app.get("/analytics", async(req, res) => {
  try {
    const { count: totalComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalComplete } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('WorkStatus', 'Complete');
    
    const { count: totalPending } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('WorkStatus', 'Pending');
    
    const { count: totalInProgress } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('WorkStatus', 'In Progress');
    
    const { count: totalComplaintsWater } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_W');
    
    const { count: totalComplaintsElectricity } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_E');
    
    const { count: totalComplaintsPublicInfrastructure } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_PI');
    
    const { count: totalComplaintsCleanliness } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_C');
    
    const { count: totalCleanlinessPending } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_C')
      .eq('WorkStatus', 'Pending');
    
    const { count: totalCleanlinessInProgress } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_C')
      .eq('WorkStatus', 'In Progress');
    
    const { count: totalCleanlinessComplete } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_C')
      .eq('WorkStatus', 'Complete');
    
    const { count: totalElectricityPending } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_E')
      .eq('WorkStatus', 'Pending');
    
    const { count: totalElectricityInProgress } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_E')
      .eq('WorkStatus', 'In Progress');
    
    const { count: totalElectricityComplete } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_E')
      .eq('WorkStatus', 'Complete');
    
    const { count: totalWaterPending } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_W')
      .eq('WorkStatus', 'Pending');
    
    const { count: totalWaterInProgress } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_W')
      .eq('WorkStatus', 'In Progress');
    
    const { count: totalWaterComplete } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_W')
      .eq('WorkStatus', 'Complete');
    
    const { count: totalPublicInfrastructurePending } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_PI')
      .eq('WorkStatus', 'Pending');
    
    const { count: totalPublicInfrastructureInProgress } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_PI')
      .eq('WorkStatus', 'In Progress');
    
    const { count: totalPublicInfrastructureComplete } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('Department', 'DPT_PI')
      .eq('WorkStatus', 'Complete');

    res.status(200).json({
      success: true,
      total: {
        complaints: totalComplaints,
        complete: totalComplete,
        pending: totalPending,
        inProgress: totalInProgress
      },
      byDepartment: {
        water: {
          total: totalComplaintsWater,
          complete: totalWaterComplete,
          pending: totalWaterPending,
          inProgress: totalWaterInProgress
        },
        electricity: {
          total: totalComplaintsElectricity,
          complete: totalElectricityComplete,
          pending: totalElectricityPending,
          inProgress: totalElectricityInProgress
        },
        publicInfrastructure: {
          total: totalComplaintsPublicInfrastructure,
          complete: totalPublicInfrastructureComplete,
          pending: totalPublicInfrastructurePending,
          inProgress: totalPublicInfrastructureInProgress
        },
        cleanliness: {
          total: totalComplaintsCleanliness,
          complete: totalCleanlinessComplete,
          pending: totalCleanlinessPending,
          inProgress: totalCleanlinessInProgress
        }
      }
    });
  } catch(err) {
    console.error("Analytics error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get all complaints assigned to a specific employee
app.get("/employee/:Eid/complaints", async(req, res) => {
  try {
    const Eid = req.params.Eid;
    
    console.log("==========================================");
    console.log("📋 Fetching complaints for employee:", Eid);
    console.log("==========================================");
   
    const { data: employeeData, error: empError } = await supabase
      .from('EmployeeProfile')
      .select('*')
      .eq('Eid', Eid)
      .single();
   
    if (empError) {
      console.error("❌ Employee not found:", empError);
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
        error: empError.message
      });
    }
    
    console.log("✅ Employee found:", employeeData.Name);
   
    const { data: assignedComplaints, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('Eid', Eid)
      .order('CreatedAt', { ascending: false });
   
    if (fetchError) {
      console.error("❌ Database error fetching complaints:", fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch complaints for employee.',
        error: fetchError.message
      });
    }
    
    console.log("📊 Complaints found:", assignedComplaints?.length || 0);
    console.log("==========================================");
   
    res.status(200).json({
      success: true,
      data: assignedComplaints || [],
      employee: employeeData,
      count: assignedComplaints?.length || 0
    });
  } catch(err) {
    console.error("❌ Server error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at: http://localhost:${port}`);
});
