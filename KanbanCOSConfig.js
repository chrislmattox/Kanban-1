KanbanCOSConfigPanel = function(rallyDataSource, onConfigHide) {
        rally.sdk.ComponentBase.call(this);
    
        this.getValidEvents = function() {
            return {onHide:"onHide"};
        };
    
        var that = this;
        var projectPrefRef, workspacePrefRef, currentCOSPrefs = {};
        var dialog, classOfServiceFieldDropdown;
		
        var allAttributes = {}, classOfServiceValues = {};
        var controls = [], rows = [], accessors = [];
    
        var notMappedKey = "NotMapped";
        var notMappedVal = "-- Not Mapped --";
           
        //show list of kanbanable states
        that.display = function() {
			that._displayClassOfServiceFieldDropDown(this._displayClassOfServicePreferences);
        };
		
        that.show = function() {
            if (dialog) {
                dialog.show();
            }
        };
    
        that.hide = function() {
            if (dialog) {
                dialog.hide();
            }
        };
    
        that.displayDialog = function() {
            if (dialog) {
                return;
            }
            function createDialog(names) {
                var content = dojo.byId("cosConfigPanel");
                var title;
                dojo.byId("cosConfigPanel").style.visibility = "visible";
                if (names.projectName) {
                    title = "Configure Class of Serivce Settings for " + names.projectName + " Project";
                }
                else if (names.workspaceName) {
                    title = "Configure Class of Serivce Settings for Current Project";
                }
                else {
                    title = "Configure Default Class of Serivce Settings";
                }
                dialog = new rally.sdk.ui.basic.Dialog({
                    id : new Date().toString(),
                    title: title,
                    width: 400,
                    height: 350,
                    draggable:true,
                    closable:false,
                    content: content
                });
    
                dialog.addEventListener("onHide", function() {
                    that.fireEvent(that.getValidEvents().onHide, {});
                });
                dialog.display();
                that.displaySaveCancelFeatures();
            }
    
            that._retrievePreferences(createDialog);
        };
    
        that.displaySaveCancelFeatures = function() {
	
			var buttonContainers = dojo.query(".buttonContainer");
			var num = (buttonContainers.length > 1) ? 1 : 0;
            var buttonContainer = dojo.query(".buttonContainer")[num];
			
            dojo.addClass(buttonContainer, "saveCancelButtons");
    
            var saveButton = new rally.sdk.ui.basic.Button({text:"Save", value:"Save"});
            saveButton.display(buttonContainer, function() {
                that._storeValues(that._saveComplete);
            });
    
            var cancelLink = "<a href='' id='cancelLink'>Cancel</a>";
            dojo.place(cancelLink, buttonContainer);
            dojo.connect(dojo.byId('cancelLink'), "onclick", function(event) {
                dialog.hide();
                that._setValues();
                dojo.stopEvent(event);
            });
        };
    
        that._addControlToRow = function(row, divId, control, containerCss) {
            var td = document.createElement("td");
            var div = document.createElement("div");
            if (containerCss) {
                dojo.addClass(div, containerCss);
            }
            td.appendChild(div);
            div.id = divId;
            control.display(div);
            controls.push(control);
            row.appendChild(td);
        };
        
		that._createAllowedValueCOSTableRow = function(allowedValue, fieldName) {
            var stringValue = allowedValue.StringValue;
            var row = document.createElement("tr");
    
    
            var columnNameContainer = document.createElement("td");
            columnNameContainer.innerHTML = stringValue || "-- No Entry --";
            row.appendChild(columnNameContainer);
			    
            var colorDropdownConfig = {
                defaultValue: "None",
                rememberSelection:false,
                width:115
            };
            var colorMappingDropdown = new rally.sdk.ui.basic.Dropdown(colorDropdownConfig);
            
            var classOfServiceColorVals = {};
            classOfServiceColorVals["#FFFFFF"] = "None";
            classOfServiceColorVals["#FFCC99"] = "Peach";
            classOfServiceColorVals["#FFFFCC"] = "Eggshell";
            classOfServiceColorVals["#CCCCFF"] = "Purple";
            classOfServiceColorVals["#FFCC00"] = "Orange";
            classOfServiceColorVals["#CCFF66"] = "Spring Green";
            classOfServiceColorVals["#CCCC99"] = "Sand";
            classOfServiceColorVals["#99CCFF"] = "Light Blue";
            
            colorMappingDropdown.setItems(classOfServiceColorVals);

            that._addControlToRow(row, fieldName + "-dropdown-" + rows.length, colorMappingDropdown);			
			
            var accessor = {
                field:stringValue,
                get: function() {
                    var result = {};
                   
                    var colorValue = colorMappingDropdown.getValue();
                    if (colorValue !== notMappedKey) {
                        result.state = colorValue;
                    }
                    return result;
                },
                set:function(object) {
                    if (object.state) {
                        colorMappingDropdown.setValue(object.state);
                    } else {
                        colorMappingDropdown.setValue(notMappedVal);
                    }
                }
            };
            accessors.push(accessor);
            return row;
        };
	
        that._destroyPreviousControls = function() {
            dojo.forEach(controls, function(control) {
                if (control && control.destroy) {
                    control.destroy();
                }
            });
            controls = [];
            dojo.forEach(rows, function(row) {
                if (row) {
                    dojo.destroy(row);
                }
            });
            rows = [];
        };
       
		that._displayClassOfServicePreferences = function(dropdown, args) {
            that._destroyPreviousControls();
            accessors = [];
            var attributeObject = allAttributes[args.value];
            var tableBody = dojo.byId("configCOSTableBody");
			
			if (attributeObject) {		
				dojo.forEach(attributeObject.AllowedValues, function(allowed) {
				   var row = that._createAllowedValueCOSTableRow(allowed, attributeObject.ElementName);
				   rows.push(row);
				   tableBody.appendChild(row);
				});	
			}

            that.displayDialog();
        };
	
        that._translateAllowedValuesToDropdownItems = function(values) {
            var items = {};
            items[notMappedKey] = notMappedVal;
            dojo.forEach(values, function(value) {
                items[value.StringValue] = value.StringValue;
            });
            return items;
        };
            
		that._displayClassOfServiceFieldDropDown = function(callback) {
            allAttributes = {};
    
            function gatherAttributes(results) {
    
                try {
                	var usableFields = {};
                	usableFields["none"] = "None";
                	
                    var firstAttr,classOfServiceAttr,attributes = [];
    
                    dojo.forEach(results.types, function(type) {
                        attributes = attributes.concat(type.Attributes);
                    });
                    attributes.sort(function(a, b) {
                        var nameA = a.Name.toLowerCase();
                        var nameB = b.Name.toLowerCase();
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }
                        return 0;
                    });
    
                    dojo.forEach(attributes, function(attr) {
                        if (attr.Constrained && attr.AttributeType !== "OBJECT" && attr.AttributeType !== "COLLECTION") {
                            firstAttr = firstAttr || attr;
                            usableFields[attr.ElementName] = attr.Name;
                            allAttributes[attr.ElementName] = attr;
                        }

						if (attr.Name == "Class of Service") {
							classOfServiceAttr = attr;
							classOfServiceValues = that._translateAllowedValuesToDropdownItems(attr.AllowedValues);
						}
                    });

                    classOfServiceFieldDropdown = new rally.sdk.ui.basic.Dropdown({
                            defaultValue: usableFields["none"],//classOfServiceAttr.ElementName || firstAttr.ElementName,
                            label:"Class of Service Field",
                            showLabel:true,
                            items:usableFields
                         });
						 
                    classOfServiceFieldDropdown.addEventListener("onLoad", callback);
                    classOfServiceFieldDropdown.addEventListener("onChange", callback);
                    classOfServiceFieldDropdown.display("classOfServiceDropdown");
                }
                catch(ex) {
                    if (ex.stack) {
                        rally.Logger.warn(ex.stack);
                    }
                    rally.Logger.warn(ex);
                }
            }
    
            rallyDataSource.find({
                type:"TypeDefinition",
                key: "types",
                query:'( Name = "Hierarchical Requirement" )',
                fetch:"Name,Attributes",
                project:null
            }, gatherAttributes);
        };
	
        //This wraps our controls to get their values
        that._getValues = function() {
            var values = {
				kanbanField:"",
				cosField:classOfServiceFieldDropdown.getValue(),
                reportKanbanField:"",
                fieldInfos:{},
				cosFieldInfos:{},
                hideLastColumnIfReleased:"",
                showTaskCompletion: "",
                showDefectStatus: "",
                showAge: "",
                showAgeAfter: "",
                colorByArtifactType: ""
            };
			
			
            rally.forEach(accessors, function(value) {
                values.cosFieldInfos[value.field] = value.get();
            });
            return values;
        };
    
        //this wraps the controls and sets their values.
        that._setValues = function() {
    
            function setValues() {
                var cosFieldInfos = currentCOSPrefs.cosFieldInfos;
                // remove the Event Handler from the dropdown
                if (deleter) {
                    deleter.remove();
                }
                rally.forEach(accessors, function(accessor) {
                    if (cosFieldInfos[accessor.field]) {
                        accessor.set(cosFieldInfos[accessor.field]);
                    }
                });
            }
    
            if (classOfServiceFieldDropdown.getValue() !== currentCOSPrefs.cosField) {
                classOfServiceFieldDropdown.setValue(currentCOSPrefs.cosField);
                var deleter = classOfServiceFieldDropdown.addEventListener("onChange", setValues);
            }
            else {
                setValues();
            }
        };
    
        that._retrievePreferences = function(/*function*/callback) {
            function populateConfigForm(results) {
                var workspacePref;
                var projectPref;
                if (results.length) {
                    dojo.forEach(results, function(p) {
                        if (p.Project) {
                            //projectOid is a string need both strings to compare.
                            var projectRef = rally.sdk.util.Ref.getOidFromRef(p.Project) + "";
                            if (projectRef === rallyDataSource.projectOid) {
                                projectPref = p;
                                projectPrefRef = projectPref._ref;
                            }
                        }
                        if (p.Workspace) {
                            workspacePrefRef = p._ref;
                            workspacePref = p;
                        }
                    });
                    if (projectPref) {
                        currentCOSPrefs = projectPref.Value;
                        that._setValues();
                        callback({projectName:projectPref.Project._refObjectName});
                    }
                    else if (workspacePref) {
                        currentCOSPrefs = workspacePref.Value;
                        that._setValues();
                        callback({workspaceName:workspacePref.Workspace._refObjectName});
                    }
                } else {
                    callback({});
                }
            }
    
            rallyDataSource.preferences.getAppPreferences(populateConfigForm);
        };
    
        that._saveComplete = function() {
            dialog.hide();
            that._retrievePreferences(function() {
            });
            onConfigHide();
        };
    
        that._storeValues = function(callback) {
    
            function workspaceCallback(results) {
    
            }
    
            function errorCallback(results) {
                rally.Logger.warn(results);
            }
    
            function errorProjectCallback(results) {
                dialog.hide();
                rally.Logger.warn(results);
                if (results.Errors.length > 0) {
                    var error = results.Errors[0];
                    if (error.match(/user does not have preference write permission/i)) {
                        error = "You must have Editor permissions to setup the Kanban Board for the current project.";
                    }
                    rally.sdk.ui.AppHeader.showMessage("error", error, 10000);
                }
            }
    
            function updateAppPreference(pref) {
    
                currentCOSPrefs = dojo.fromJson(pref.Value);
				var newPrefs = currentCOSPrefs;
				
				rally.forEach(that._getValues(), function(pref, key) {
                        if (key === "cosFieldInfos") {
							newPrefs.cosFieldInfos = pref;
						}
						else if (key !== "fieldInfos") {
							if(pref) {
								newPrefs[key] = pref;		
							}							
						}
                });
				
                var updatedPref = {_ref : projectPrefRef,
                    Value:newPrefs
                };
                rallyDataSource.preferences.update(updatedPref, callback, errorProjectCallback);
            }
    
            if (!projectPrefRef) {
                if (!workspacePrefRef) {
                    rallyDataSource.preferences.createAppPreference(
                            {
                                Name: "Kanban/WipSettings",
                                Value: that._getValues(),
                                Workspace:"/Workspace/" + rallyDataSource.workspaceOid
                            },
                            workspaceCallback,
                            errorCallback);
                }
                rallyDataSource.preferences.createAppPreference(
                        {
                            Name: "Kanban/WipSettings",
                            Value: that._getValues(),
                            Project:"/Project/" + rallyDataSource.projectOid
                        },
                        callback,
                        errorProjectCallback);
            }
            else {
    
                //Re-read pref before saving so we don't clobber anything
                rallyDataSource.getRallyObject(projectPrefRef,updateAppPreference,errorCallback);
 
            }
    
        };
    
    };