import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
    FormControl,
    Autocomplete,
    TextField,
    Checkbox,
    Typography,
    Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const OptionContainer = styled(Box)(({ theme, depth }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingLeft: depth * 24,
    width: '100%',
}));

const HierarchySelect = ({ name, control, label, hierarchyData, rules, limitTags = 2, ...props }) => {
    // Flatten the tree and build lookup maps
    const { flattenedOptions, nodeMap, parentMap, childrenMap } = useMemo(() => {
        if (!hierarchyData || hierarchyData.length === 0) {
            return { flattenedOptions: [], nodeMap: {}, parentMap: {}, childrenMap: {} };
        }

        const nodeMap = {};
        const parentMap = {};
        const childrenMap = {};
        const flattened = [];

        const traverse = (nodes, depth = 0, parentId = null, group = null) => {
            nodes.forEach(node => {
                const hasChildren = node.data && node.data.length > 0;
                const nodeGroup = group === 'hierarchy' || hasChildren ? 'hierarchy' : 'isolated';

                const flatNode = {
                    id: node.id,
                    name: node.name,
                    depth,
                    parentId,
                    group: nodeGroup,
                    hasChildren,
                    selectable: node.selectable !== false, // default to true
                };
                flattened.push(flatNode);
                nodeMap[node.id] = flatNode;
                if (parentId !== null) {
                    parentMap[node.id] = parentId;
                }
                if (hasChildren) {
                    childrenMap[node.id] = node.data.map(c => c.id);
                    traverse(node.data, depth + 1, node.id, nodeGroup);
                } else {
                    childrenMap[node.id] = [];
                }
            });
        };

        // Separate roots
        const hierarchyRoots = hierarchyData.filter(root => root.data && root.data.length > 0);
        const isolatedRoots = hierarchyData.filter(root => !root.data || root.data.length === 0);

        traverse(hierarchyRoots, 0, null, 'hierarchy');

        // Divider for "Other Members" (if any isolated roots exist)
        if (isolatedRoots.length > 0) {
            flattened.push({
                id: 'divider-others',
                name: 'Other Members',
                disabled: true,
                isDivider: true,
                depth: 0,
                selectable: false,
            });
        }

        traverse(isolatedRoots, 0, null, 'isolated');

        return { flattenedOptions: flattened, nodeMap, parentMap, childrenMap };
    }, [hierarchyData]);

    const getAncestors = (nodeId) => {
        const ancestors = new Set();
        let current = nodeId;
        while (current) {
            ancestors.add(current);
            current = parentMap[current] || null;
        }
        return ancestors;
    };

    const getDescendants = (nodeId) => {
        const descendants = new Set();
        const stack = [nodeId];
        while (stack.length) {
            const id = stack.pop();
            descendants.add(id);
            const children = childrenMap[id] || [];
            children.forEach(child => stack.push(child));
        }
        return descendants;
    };

    const computeExpandedSelection = (selectedIds) => {
        const expanded = new Set();
        selectedIds.forEach(id => {
            getAncestors(id).forEach(aid => expanded.add(aid));
        });
        return expanded;
    };

    // Filter out any IDs that are not selectable (useful after toggling)
    const filterSelectable = (ids) => ids.filter(id => nodeMap[id]?.selectable !== false);

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
                const selectedIds = value || [];
                const expandedSelection = useMemo(
                    () => computeExpandedSelection(selectedIds),
                    [selectedIds, parentMap] // parentMap is stable, but we need to recompute when selectedIds changes
                );

                const selectedOptions = flattenedOptions.filter(
                    opt => !opt.isDivider && selectedIds.includes(opt.id)
                );

                const filterOptions = (options, state) => {
                    return options.filter(opt => {
                        if (opt.isDivider) return true;
                        return opt.name.toLowerCase().includes(state.inputValue.toLowerCase());
                    });
                };

                const handleToggle = (nodeId) => {
                    let newSelection = new Set(selectedIds);
                    if (expandedSelection.has(nodeId)) {
                        // Uncheck: remove node and all descendants
                        const toRemove = getDescendants(nodeId);
                        toRemove.forEach(id => newSelection.delete(id));
                    } else {
                        // Check: add node and all ancestors
                        const toAdd = getAncestors(nodeId);
                        toAdd.forEach(id => newSelection.add(id));
                    }
                    // Remove non‑selectable IDs before saving
                    const filtered = filterSelectable(Array.from(newSelection));
                    onChange(filtered);
                };

                const handleAutocompleteChange = (event, newValue, reason) => {
                    if (reason === 'clear') {
                        onChange([]);
                    } else if (reason === 'removeOption') {
                        // Find which chip was removed
                        const newIds = newValue.map(opt => opt.id);
                        const removedIds = selectedIds.filter(id => !newIds.includes(id));
                        if (removedIds.length > 0) {
                            let newSelection = new Set(selectedIds);
                            removedIds.forEach(id => {
                                const toRemove = getDescendants(id);
                                toRemove.forEach(did => newSelection.delete(did));
                            });
                            const filtered = filterSelectable(Array.from(newSelection));
                            onChange(filtered);
                        }
                    }
                    // Ignore 'selectOption' – only checkboxes add selections
                };

                return (
                    <FormControl fullWidth error={!!error} {...props}>
                        <Autocomplete
                            multiple
                            size="small"
                            disableCloseOnSelect
                            options={flattenedOptions}
                            getOptionLabel={(option) => option.name || ''}
                            isOptionEqualToValue={(option, val) => option.id === val.id}
                            filterOptions={filterOptions}
                            value={selectedOptions}
                            onChange={handleAutocompleteChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={label}
                                    variant="outlined"
                                    size="small"
                                    error={!!error}
                                    helperText={error ? error.message : null}
                                />
                            )}
                            renderOption={(props, option) => {
                                if (option.isDivider) {
                                    return (
                                        <li {...props} style={{ pointerEvents: 'none', opacity: 0.8 }}>
                                            <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">
                                                {option.name}
                                            </Typography>
                                        </li>
                                    );
                                }
                                const { key, ...liProps } = props;
                                return (
                                    <li key={option.id} {...liProps}>
                                        <OptionContainer depth={option.depth}>
                                            {option.selectable && (
                                                <Checkbox
                                                    checked={expandedSelection.has(option.id)}
                                                    onChange={() => handleToggle(option.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    size="small"
                                                />
                                            )}
                                            <Typography
                                                variant="body2"
                                                fontWeight={option.hasChildren ? 'bold' : 'normal'}
                                            >
                                                {option.name}
                                            </Typography>
                                        </OptionContainer>
                                    </li>
                                );
                            }}
                            ListboxProps={{ style: { maxHeight: 300 } }}
                            limitTags={limitTags}
                        />
                    </FormControl>
                );
            }}
        />
    );
};

export default HierarchySelect;