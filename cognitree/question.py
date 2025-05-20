from collections import defaultdict

class Node:
    def __init__(self, value,event,key):
        self.value=value
        self.event=event
        self.key=key
        self.prev=None
        self.next=None

if __name__=='__main__':
    map={}
    data = [(0, 'k1', 0), (1, 'k2', 1), (2, 'k1', 3), (3, 'k1', 9), (4, 'k3', 9), (5, 'k2', 6), (6, 'k4', 7), (7, 'k5', 8), (8, 'k5', 9), (9, 'k2', 10), (10, 'k6', 11)]
    head=Node(-1,-1,-1)
    tail=Node(-1,-1,-1)
    tail.prev=head
    head.next=tail
    def delete(node):
        prev=node.prev
        node.prev.next=node.next
        node.next.prev=prev
    def insert(node):
        prev=tail.prev
        prev.next=node
        node.next=tail
        tail.prev=node
        node.prev=prev
    for event, key, value in data:
        if key in map:
            node=map[key]
            delete(node)
        #     new_node=Node(value,event,key)
        #     insert(new_node)
        # else:
        new_node=Node(value,event,key)
        insert(new_node)
        map[key]=new_node
    cur=head.next
    while(cur!=tail):
        print(cur.event,cur.key,cur.value)
        cur=cur.next
    

            

    
    
    #     if key in map:
    #         map[key]=(event,value)
    #     else:
    #         map[key]=(event,value)
    # for key, value in map.items():
    #     print(f"Key is: {key} Event is: {value[0]} Value is:{value[1]}")